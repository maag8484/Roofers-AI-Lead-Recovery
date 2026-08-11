// Pauses a customer's Stripe subscription so no invoices are generated during the pause period.
// pause_days: number of days to pause (default 60, max 90)
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

    const body = await req.json().catch(() => ({}));
    const pauseDays = Math.min(Number(body.pause_days ?? 60), 90);
    const resumeAt = Math.floor(Date.now() / 1000) + pauseDays * 24 * 60 * 60;
    const resumeDate = new Date(resumeAt * 1000).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });

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
      return json({ error: "No active subscription found." }, 404);
    }

    if (!["active", "trialing"].includes(sub.status ?? "")) {
      return json({ error: "Subscription is not active." }, 400);
    }

    // Pause billing — Stripe voids invoices during the pause window.
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      pause_collection: {
        behavior: "void",
        resumes_at: resumeAt,
      },
    });

    // Mirror paused state in DB. Scope by stripe_subscription_id, NOT user_id:
    // a user can own several rows, and updating them all would stamp "paused"
    // over unrelated historical rows.
    await db
      .from("subscriptions")
      .update({ status: "paused" })
      .eq("stripe_subscription_id", sub.stripe_subscription_id);

    // Get user profile for email
    const { data: profile } = await db
      .from("roofing_companies")
      .select("company_name, contact_email")
      .eq("user_id", user.id)
      .maybeSingle();

    const companyName = profile?.company_name ?? user.email;

    // Email to user
    await db.functions.invoke("gmail-send", {
      body: {
        to: user.email,
        subject: "Your Roof AI account has been paused",
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <h2 style="color:#2563eb">Your account is paused</h2>
            <p>Hi ${companyName},</p>
            <p>Your Roof AI Lead Recovery account has been <strong>paused for ${pauseDays} days</strong>.</p>
            <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:20px 0">
              <p style="margin:0;font-size:14px;color:#475569">📅 Billing resumes on</p>
              <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#1e293b">${resumeDate}</p>
            </div>
            <p>No charges will be made during the pause period. Your settings, calendar, and workflows are all saved and ready when you come back.</p>
            <p>Want to resume early? Just log in and click <strong>Resume Account</strong> on your billing page.</p>
            <p style="margin-top:24px">
              <a href="https://roofaileadrecovery.com/billing" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
                Go to Billing
              </a>
            </p>
            <p style="margin-top:32px;color:#6b7280;font-size:13px">
              Questions? Contact <a href="mailto:support@roofaileadrecovery.com">support@roofaileadrecovery.com</a>
            </p>
          </div>
        `,
      },
    }).catch(() => null); // non-fatal

    // Notify admin
    await db.functions.invoke("gmail-send", {
      body: {
        to: ADMIN_EMAIL,
        subject: `[Roof AI] Account paused — ${companyName}`,
        html: `
          <p><strong>${companyName}</strong> (${user.email}) has paused their account for ${pauseDays} days.</p>
          <p>Billing resumes: <strong>${resumeDate}</strong></p>
          <p>Subscription ID: ${sub.stripe_subscription_id}</p>
        `,
      },
    }).catch(() => null); // non-fatal

    return json({ ok: true, resumes_at: resumeAt, pause_days: pauseDays, resume_date: resumeDate });
  } catch (err) {
    console.error("stripe-pause-subscription error", err);
    return json({ error: String(err?.message ?? err) }, 500);
  }
});
