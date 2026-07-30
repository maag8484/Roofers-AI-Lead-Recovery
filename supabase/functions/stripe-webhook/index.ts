// Stripe webhook → keeps the subscriptions table in sync.
// IMPORTANT: deploy with --no-verify-jwt (Stripe can't send a Supabase JWT).
//   supabase functions deploy stripe-webhook --no-verify-jwt
import Stripe from "https://esm.sh/stripe@17?target=deno";
import { serviceClient } from "../_shared/supabase.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

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
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;

      if (userId) {
        // Extract cancellation reason from Stripe's cancellation_details
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

        // Advance setup step past payment
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
