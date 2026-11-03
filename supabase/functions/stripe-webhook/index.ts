// Stripe webhook → keeps the subscriptions table in sync.
// IMPORTANT: deploy with --no-verify-jwt (Stripe can't send a Supabase JWT).
//   supabase functions deploy stripe-webhook --no-verify-jwt
import type Stripe from "https://esm.sh/stripe@17?target=deno";
import { serviceClient } from "../_shared/supabase.ts";
import { stripe, STRIPE_WEBHOOK_SECRET as WEBHOOK_SECRET } from "../_shared/stripe.ts";

function toIso(unix?: number | null) {
  return unix ? new Date(unix * 1000).toISOString() : null;
}

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const db = serviceClient();

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata;
      if (meta?.purpose === "roof_call_pack" && session.livemode && session.payment_status === "paid" && session.mode === "payment") {
        const packs: Record<string,[string,number]> = {"20":["price_1UXn65CB5wADtZS19CXdROLL",5000],"50":["price_1UXn66CB5wADtZS12VbDpqYh",10000]};
        const pack = packs[meta.pack_calls];
        if (!pack || typeof session.payment_intent !== "string") throw Error("Invalid pack");
        const intent = await stripe.paymentIntents.retrieve(session.payment_intent,{expand:['latest_charge']});
        const charge = intent.latest_charge;
        if(intent.status!=='succeeded' || !intent.livemode || intent.customer!==session.customer || intent.currency!=='usd' || intent.amount_received!==pack[1] || !charge || typeof charge==='string' || !charge.paid || !charge.captured || charge.disputed || charge.amount_refunded!==0) throw Error('Pack payment not settled');
        const items = await stripe.checkout.sessions.listLineItems(session.id,{limit:2});
        const item = items.data[0];
        if (items.has_more || items.data.length!==1 || item.quantity!==1 || item.price?.id!==pack[0] || session.currency!=="usd" || session.amount_subtotal!==pack[1] || session.amount_total!==pack[1]) throw Error("Pack amount mismatch");
        const {data:period,error} = await db.from("roof_paid_periods").select("*").eq("id",meta.period_id).eq("company_id",meta.company_id).single();
        if(error || !period) throw Error("Missing pack period");
        const sub=await stripe.subscriptions.retrieve(period.subscription_id);
        if(sub.customer!==session.customer || session.created*1000<Date.parse(period.starts_at) || event.created*1000>=Date.parse(period.ends_at)) throw Error("Pack payment requires reconciliation");
        const {error:writeError}=await db.from("roof_call_pack_receipts").upsert({
          stripe_session_id:session.id,payment_intent_id:session.payment_intent,period_id:period.id,price_id:pack[0],calls:Number(meta.pack_calls),amount_cents:pack[1],currency:"usd"
        },{onConflict:"stripe_session_id",ignoreDuplicates:true});
        if(writeError) throw Error("Pack receipt write failed");
      }
    }
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;

      if (userId) {
        const cancelDetails = (sub as any).cancellation_details;
        const cancelReason = cancelDetails?.reason ?? null;
        const canceledAt = sub.canceled_at ? toIso(sub.canceled_at) : null;
        const cancelAtPeriodEnd = sub.cancel_at_period_end ?? false;

        await db.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: sub.customer as string,
            stripe_subscription_id: sub.id,
            status: sub.status,
            trial_ends_at: toIso(sub.trial_end),
            current_period_start: toIso(sub.current_period_start),
            current_period_end: toIso(sub.current_period_end),
            cancel_reason: cancelReason,
            canceled_at: canceledAt,
            cancel_at_period_end: cancelAtPeriodEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_subscription_id" }
        );

        await db
          .from("roofing_companies")
          .update({ setup_step: 3 })
          .eq("user_id", userId)
          .lt("setup_step", 3);


      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error("stripe-webhook handler error", err);
    return new Response("Handler error", { status: 500 });
  }
});
