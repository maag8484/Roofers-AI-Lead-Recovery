// Gmail OAuth callback. Deploy with --no-verify-jwt (Google redirects the
// browser here with no Supabase JWT). Because it's anonymously reachable, the
// FIRST thing it does is verify the HMAC-signed `state` — BEFORE any call to
// Google's token endpoint. A bad/expired state is rejected without spending
// Google quota and is logged as GMAIL_OAUTH_CALLBACK_REJECTED.
import { serviceClient, encrypt } from "../_shared/supabase.ts";
import { verifyState } from "../_shared/oauthState.ts";

const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const REDIRECT_URI = Deno.env.get("GMAIL_REDIRECT_URI")!;

function redirect(to: string) {
  return new Response(null, { status: 302, headers: { Location: to } });
}

async function logRejection(reason: string) {
  try {
    await serviceClient()
      .from("activity_logs")
      .insert({
        action: "GMAIL_OAUTH_CALLBACK_REJECTED",
        result: "ERROR",
        status: "ERROR",
        metadata: { reason },
      });
  } catch (e) {
    console.error("failed to log callback rejection", e);
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state") ?? "";

  // ---- 1. VERIFY STATE FIRST (before any Google call) --------------------
  const now = Math.floor(Date.now() / 1000);
  const verified = await verifyState(stateRaw, now);
  if (!verified.ok) {
    await logRejection(verified.reason);
    // No trusted redirect target on a bad state — bounce to a safe default.
    return redirect("/admin/integrations/email?gmail=error&reason=state");
  }

  const back = verified.redirect_to || "/admin/integrations/email";
  if (!code) {
    await logRejection("missing_code");
    return redirect(`${back}?gmail=error&reason=code`);
  }

  try {
    // ---- 2. Exchange code for tokens -------------------------------------
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Gmail token exchange failed", tokens);
      return redirect(`${back}?gmail=error&reason=exchange`);
    }

    // Which mailbox was connected (for GMAIL_FROM sanity / display).
    let email: string | null = null;
    try {
      const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      email = (await infoRes.json()).email ?? null;
    } catch {
      email = null;
    }

    const db = serviceClient();

    // Determine CONNECTED vs RECONNECTED for the event label.
    const { data: prev } = await db
      .from("email_integration_status")
      .select("connected_at")
      .eq("id", 1)
      .maybeSingle();
    const isReconnect = !!prev?.connected_at;

    // ---- 3. Store encrypted tokens + flip singleton to CONNECTED ---------
    const nowIso = new Date().toISOString();
    const expiresIso = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

    await db
      .from("email_integration_status")
      .update({
        provider: "GMAIL",
        status: "CONNECTED",
        connected_at: nowIso,
        oauth_expires_at: expiresIso,
        encrypted_access_token: await encrypt(tokens.access_token),
        // refresh_token only comes back with prompt=consent; keep prior if absent.
        encrypted_refresh_token: tokens.refresh_token
          ? await encrypt(tokens.refresh_token)
          : undefined,
        last_error: null,
        last_health_check_at: nowIso,
      })
      .eq("id", 1);

    // ---- 4. Activity log + admin notification ----------------------------
    const action = isReconnect ? "GMAIL_RECONNECTED" : "GMAIL_CONNECTED";
    await db.from("activity_logs").insert({
      action,
      performed_by: verified.admin_id,
      result: "OK",
      status: "OK",
      metadata: { email },
    });

    await db.from("admin_notifications").insert({
      type: action,
      title: isReconnect ? "Gmail reconnected" : "Gmail connected",
      body: email ? `Connected mailbox: ${email}` : "Gmail integration is now connected.",
      severity: "INFO",
      metadata: { email, admin_id: verified.admin_id },
    });

    return redirect(`${back}?gmail=connected`);
  } catch (err) {
    console.error("gmail-oauth-callback error", err);
    return redirect(`${back}?gmail=error&reason=server`);
  }
});
