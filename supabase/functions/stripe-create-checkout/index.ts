// Creates a Stripe Checkout Session for the $299/month plan with a 7-day trial.
// Called from the signup wizard (step 3).
import Stripe from "https://esm.sh/stripe@17?target=deno";
import { corsHeaders, handleOptions, json } from "../_shared/cors.ts";
import { getUser, serviceClient } from "../_shared/supabase.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const PRICE_ID = Deno.env.get("STRIPE_PRICE_ID")!; // $299/month recurring price

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  try {
    const { user, error } = await getUser(req);
    if (!user) return json({ error: error ?? "Unauthorized" }, 401);

    const { trial_type, success_url, cancel_url } = await req.json();

    // Reuse an existing Stripe customer if we have one.
    const db = serviceClient();
    const { data: existing } = await db
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

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
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { supabase_user_id: user.id },
      },
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
