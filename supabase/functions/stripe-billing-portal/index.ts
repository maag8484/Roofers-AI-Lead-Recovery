// Creates a Stripe Billing Portal session so customers can manage their subscription.
import { corsHeaders, handleOptions, json } from "../_shared/cors.ts";
import { getUser, serviceClient } from "../_shared/supabase.ts";
import { getGoverningSubscription } from "../_shared/subscription.ts";
import { stripe } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  try {
    const { user, error } = await getUser(req);
    if (!user) return json({ error: error ?? "Unauthorized" }, 401);

    const { return_url } = await req.json();

    const db = serviceClient();
    // A user can hold several subscription rows (user_id is not UNIQUE), so
    // maybeSingle() would error and read as "no subscription", 404'ing a paying
    // customer out of the portal. Take the row that actually has a Stripe id.
    const sub = await getGoverningSubscription(
      db,
      user.id,
      "stripe_customer_id, status, created_at",
      "stripe_customer_id"
    );

    if (!sub?.stripe_customer_id) {
      return json({ error: "No subscription found." }, 404);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url,
    });

    return json({ url: session.url });
  } catch (err) {
    console.error("stripe-billing-portal error", err);
    return json({ error: String(err?.message ?? err) }, 500);
  }
});
