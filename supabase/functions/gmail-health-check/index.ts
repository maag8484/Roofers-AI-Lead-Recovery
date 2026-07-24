// Gmail health probe. Deploy with --no-verify-jwt so pg_cron / external cron can
// hit it. Safe to expose: it only READS the singleton and UPDATES health fields
// (it never sends mail and returns no secrets).
//
// Logic: attempt a token refresh using the stored refresh token.
//   success -> status stays/becomes CONNECTED, last_health_check_at updated.
//   failure -> status = NEEDS_REAUTH, last_error set, CRITICAL admin_notification
//              written, last_health_check_at updated.
import { handleOptions, json } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { refreshAccessToken } from "../_shared/gmail.ts";

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  const db = serviceClient();
  const nowIso = new Date().toISOString();

  const { data: row } = await db
    .from("email_integration_status")
    .select("status, encrypted_refresh_token, connected_at")
    .eq("id", 1)
    .maybeSingle();

  // Never connected -> nothing to probe; just stamp the check time.
  if (!row || !row.connected_at || !row.encrypted_refresh_token) {
    await db
      .from("email_integration_status")
      .update({ last_health_check_at: nowIso })
      .eq("id", 1);
    return json({ status: row?.status ?? "DISCONNECTED", checked: true });
  }

  try {
    const { expires_in } = await refreshAccessToken(row.encrypted_refresh_token);
    await db
      .from("email_integration_status")
      .update({
        status: "CONNECTED",
        oauth_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        last_health_check_at: nowIso,
        last_error: null,
      })
      .eq("id", 1);
    return json({ status: "CONNECTED", checked: true });
  } catch (err) {
    const msg = String((err as Error)?.message ?? err);

    await db
      .from("email_integration_status")
      .update({
        status: "NEEDS_REAUTH",
        last_error: msg,
        last_health_check_at: nowIso,
      })
      .eq("id", 1);

    // Only create a CRITICAL notification when transitioning INTO a bad state,
    // to avoid a new notification on every 5-minute cron tick while broken.
    if (row.status === "CONNECTED") {
      await db.from("admin_notifications").insert({
        type: "GMAIL_NEEDS_REAUTH",
        title: "Gmail needs re-authentication",
        body: `Token refresh failed: ${msg.slice(0, 200)}. Reconnect Gmail to resume sending.`,
        severity: "CRITICAL",
        metadata: { error: msg },
      });
    }

    return json({ status: "NEEDS_REAUTH", checked: true, error: msg });
  }
});
