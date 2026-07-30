// Pauses a customer's Stripe subscription so no invoices are generated during the pause period.
// pause_days: number of days to pause (default 60, max 90)
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

    const body = await req.json().catch(() => ({}));
    const pauseDays = Math.min(Number(body.pause_days ?? 60), 90);
    const resumeAt = Math.floor(Date.now() / 1000) + pauseDays * 24 * 60 * 60;

    const db = serviceClient();
    const { data: sub } = await db
      .from("subscriptions")
      .select("stripe_subscription_id, stripe_customer_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub?.stripe_subscription_id) {
      return json({ error: "No active subscription found." }, 404);
    }

    if (!["active", "trialing"].includes(sub.status ?? "")) {
      return json({ error: "Subscription is not active." }, 400);
    }

    // Pause billing — Stripe voids invoices during the pause window.
    // The subscription stays alive; it auto-resumes at resumes_at.
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      pause_collection: {
        behavior: "void",
        resumes_at: resumeAt,
      },
    });

    // Mirror the paused state in our DB so the dashboard reflects it.
    await db
      .from("subscriptions")
      .update({ status: "paused" })
      .eq("user_id", user.id);

    return json({ ok: true, resumes_at: resumeAt, pause_days: pauseDays });
  } catch (err) {
    console.error("stripe-pause-subscription error", err);
    return json({ error: String(err?.message ?? err) }, 500);
  }
});
