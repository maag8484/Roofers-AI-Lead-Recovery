// Google redirects here with ?code&state. We exchange the code, encrypt the
// tokens, store the connection, then redirect back into the app.
// Deploy with --no-verify-jwt (Google can't send a Supabase JWT).
//   supabase functions deploy google-oauth-callback --no-verify-jwt
import { serviceClient, encrypt } from "../_shared/supabase.ts";

const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI")!;

function redirect(to: string) {
  return new Response(null, { status: 302, headers: { Location: to } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");

  let state: { uid: string; redirect_to: string };
  try {
    state = JSON.parse(atob(stateRaw ?? ""));
  } catch {
    return redirect("/?calendar=error");
  }
  const back = state.redirect_to || "/setup/calendar";
  if (!code) return redirect(`${back}?calendar=error`);

  try {
    // Exchange authorization code for tokens.
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
      console.error("Google token exchange failed", tokens);
      return redirect(`${back}?calendar=error`);
    }

    // Look up the connected account's email.
    const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const info = await infoRes.json();

    const db = serviceClient();
    await db.from("calendar_connections").upsert(
      {
        user_id: state.uid,
        provider: "google",
        google_email: info.email ?? null,
        calendar_id: "primary",
        access_token: await encrypt(tokens.access_token),
        refresh_token: tokens.refresh_token ? await encrypt(tokens.refresh_token) : null,
        expires_at: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
        connected_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    return redirect(`${back}?calendar=connected`);
  } catch (err) {
    console.error("google-oauth-callback error", err);
    return redirect(`${back}?calendar=error`);
  }
});
