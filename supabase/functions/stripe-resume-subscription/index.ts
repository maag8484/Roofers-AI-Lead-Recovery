// Resumes a paused Stripe subscription immediately.
import Stripe from "https://esm.sh/stripe@17?target=deno";
import { corsHeaders, handleOptions, json } from "../_shared/cors.ts";
import { getUser, serviceClient } from "../_shared/supabase.ts";
import { getGoverningSubscription } from "../_shared/subscription.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const ADMIN_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") ?? "support@roofaileadrecovery.com";

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  try {
    const { user, error } = await getUser(req);
    if (!user) return json({ error: error ?? "Unauthorized" }, 401);

    const db = serviceClient();
    // Multiple rows per user are possible (user_id is not UNIQUE) — maybeSingle()
    // would error and look like "no subscription". Take the governing row.
    const sub = await getGoverningSubscription(
      db,
      user.id,
      "stripe_subscription_id, stripe_customer_id, status, created_at",
      "stripe_subscription_id"
    );

    if (!sub?.stripe_subscription_id) {
      return json({ error: "No subscription found." }, 404);
    }

    // Remove pause_collection to resume immediately
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      pause_collection: "" as any,
    });

    // Update DB status back to active. Scope by stripe_subscription_id, NOT
    // user_id, so unrelated historical rows aren't stamped "active".
    await db
      .from("subscriptions")
      .update({ status: "active" })
      .eq("stripe_subscription_id", sub.stripe_subscription_id);

    // Get user profile for email
    const { data: profile } = await db
      .from("roofing_companies")
      .select("company_name, contact_email, business_phone")
      .eq("user_id", user.id)
      .maybeSingle();

    const companyName = profile?.company_name ?? user.email;

    // Send email to user via gmail-send
    await db.functions.invoke("gmail-send", {
      body: {
        to: user.email,
        subject: "Your Roof AI account is back active!",
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <h2 style="color:#2563eb">Welcome back, ${companyName}!</h2>
            <p>Your Roof AI Lead Recovery account has been <strong>resumed</strong> and is now fully active.</p>
            <p>Your AI is back answering missed calls and booking inspections for you.</p>
            <p style="margin-top:24px">
              <a href="https://roofaileadrecovery.com/dashboard" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
                Go to Dashboard
              </a>
            </p>
            <p style="margin-top:32px;color:#6b7280;font-size:13px">
              Questions? Reply to this email or contact <a href="mailto:support@roofaileadrecovery.com">support@roofaileadrecovery.com</a>
            </p>
          </div>
        `,
      },
    }).catch(() => null); // non-fatal

    // Notify admin
    await db.functions.invoke("gmail-send", {
      body: {
        to: ADMIN_EMAIL,
        subject: `[Roof AI] Account resumed — ${companyName}`,
        html: `
          <p><strong>${companyName}</strong> (${user.email}) has resumed their account.</p>
          <p>Subscription ID: ${sub.stripe_subscription_id}</p>
        `,
      },
    }).catch(() => null); // non-fatal

    return json({ ok: true });
  } catch (err) {
    console.error("stripe-resume-subscription error", err);
    return json({ error: String(err?.message ?? err) }, 500);
  }
});
