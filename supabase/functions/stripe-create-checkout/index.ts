// Creates a Stripe Checkout Session for the $299/month plan with a 7-day trial.
// Called from the signup wizard (step 3).
import { corsHeaders, handleOptions, json } from "../_shared/cors.ts";
import { getUser, serviceClient } from "../_shared/supabase.ts";
import { getGoverningSubscription } from "../_shared/subscription.ts";
import { stripe, STRIPE_PRICE_ID as PRICE_ID } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  try {
    const { user, error } = await getUser(req);
    if (!user) return json({ error: error ?? "Unauthorized" }, 401);

    const { trial_type, success_url, cancel_url } = await req.json();

    // Reuse an existing Stripe customer if we have one.
    //
    // This is where duplicate rows came from: with several subscription rows,
    // maybeSingle() errored and returned null, so this looked like "no customer
    // yet" and minted a BRAND NEW Stripe customer on every checkout — each of
    // which the webhook then inserted as another row, compounding the problem.
    const db = serviceClient();
    const existing = await getGoverningSubscription(
      db,
      user.id,
      "stripe_customer_id, status, created_at",
      "stripe_customer_id"
    );

    let customerId = existing?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      currency: "usd",
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { supabase_user_id: user.id },
      },
      automatic_tax: { enabled: true },
      customer_update: { address: "auto" },
      custom_text: {
        submit: { message: "Recover missed calls. Book more roof inspections. Grow your business for just $299/month." } as any,
      },
      success_url,
      cancel_url,
      allow_promotion_codes: true,
    });

    return json({ url: session.url });
  } catch (err) {
    console.error("stripe-create-checkout error", err);
    return json({ error: String(err?.message ?? err) }, 500);
  }
});
