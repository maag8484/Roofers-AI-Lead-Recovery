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

        // Send new user notification email on first subscription
        if (event.type === "customer.subscription.created") {
          const customer = typeof sub.customer === "string"
            ? await stripe.customers.retrieve(sub.customer) as Stripe.Customer
            : sub.customer as Stripe.Customer;

          await db.functions.invoke("gmail-send", {
            body: {
              to: "zaid.ullah@growwstacks.com",
              subject: `New User Signed Up — ${customer.email}`,
              html: `
                <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
                  <h2 style="color:#2563eb">New Customer Signed Up 🎉</h2>
                  <table style="width:100%;font-size:14px;border-collapse:collapse">
                    <tr><td style="padding:8px 0;color:#64748b;width:35%">Email</td><td style="padding:8px 0;font-weight:600">${customer.email}</td></tr>
                    <tr><td style="padding:8px 0;color:#64748b">Name</td><td style="padding:8px 0;font-weight:600">${customer.name ?? "—"}</td></tr>
                    <tr><td style="padding:8px 0;color:#64748b">Stripe Customer</td><td style="padding:8px 0;font-family:monospace;font-size:12px">${customer.id}</td></tr>
                    <tr><td style="padding:8px 0;color:#64748b">Supabase User</td><td style="padding:8px 0;font-family:monospace;font-size:12px">${userId}</td></tr>
                    <tr><td style="padding:8px 0;color:#64748b">Plan</td><td style="padding:8px 0;font-weight:600">$299/month</td></tr>
                    <tr><td style="padding:8px 0;color:#64748b">Signed up at</td><td style="padding:8px 0;font-weight:600">${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET</td></tr>
                  </table>
                  <div style="margin-top:20px">
                    <a href="https://roofaileadrecovery.com/admin/customers" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View in Admin Panel →</a>
                  </div>
                </div>
              `,
            },
          }).catch((e: any) => console.error("New user email failed:", e));
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error("stripe-webhook handler error", err);
    return new Response("Handler error", { status: 500 });
  }
});
