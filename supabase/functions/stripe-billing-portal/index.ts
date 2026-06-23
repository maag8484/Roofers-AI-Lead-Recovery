// Creates a Stripe Billing Portal session so customers can manage their subscription.
import Stripe from "https://esm.sh/stripe@17?target=deno";
import { corsHeaders, handleOptions, json } from "../_shared/cors.ts";
import { getUser, serviceClient } from "../_shared/supabase.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  try {
    const { user, error } = await getUser(req);
    if (!user) return json({ error: error ?? "Unauthorized" }, 401);

    const { return_url } = await req.json();

    const db = serviceClient();
    const { data: sub } = await db
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

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
