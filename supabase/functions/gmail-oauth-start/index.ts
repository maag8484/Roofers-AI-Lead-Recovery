// Builds the Gmail OAuth consent URL (gmail.send scope). Admin-gated.
// The `state` echoed to the callback is an HMAC-signed, 5-minute token carrying
// the admin's id — this is the CSRF protection for the JWT-off callback.
//
// Reuses the existing Google OAuth client (GOOGLE_CLIENT_ID/SECRET); a NEW
// redirect URI (GMAIL_REDIRECT_URI) points at gmail-oauth-callback and must be
// registered in the Google Cloud console.
import { handleOptions, json } from "../_shared/cors.ts";
import { getUser, isAdminUser } from "../_shared/supabase.ts";
import { signState } from "../_shared/oauthState.ts";

const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const REDIRECT_URI = Deno.env.get("GMAIL_REDIRECT_URI")!;

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  try {
    const { user } = await getUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    // Only admins may connect/reconnect the workspace Gmail account.
    if (!(await isAdminUser(user.id))) return json({ error: "Forbidden" }, 403);

    const { redirect_to } = await req.json().catch(() => ({}));

    // Signed, short-lived state. nonce adds entropy; iat drives 5-min expiry.
    const nonce = crypto.randomUUID();
    const iat = Math.floor(Date.now() / 1000);
    const state = await signState(
      { admin_id: user.id, redirect_to: redirect_to ?? "/admin/integrations/email", nonce },
      iat
    );

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SCOPES);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent"); // force refresh_token issuance
    url.searchParams.set("state", state);

    return json({ url: url.toString() });
  } catch (err) {
    console.error("gmail-oauth-start error", err);
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
});
