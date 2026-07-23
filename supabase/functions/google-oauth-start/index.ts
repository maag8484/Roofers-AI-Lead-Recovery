// Builds the Google OAuth consent URL. State carries the user id + return path.
import { handleOptions, json } from "../_shared/cors.ts";
import { getUser, isAdminUser } from "../_shared/supabase.ts";

const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
// Must exactly match an Authorized redirect URI in the Google Cloud console.
const REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI")!;

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  try {
    const { user } = await getUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { redirect_to, target_user_id } = await req.json();

    // By default a user connects their OWN calendar (uid = caller). If a
    // target_user_id is passed, this is an admin connecting a customer's
    // calendar on their behalf — verify the caller is actually an admin before
    // honoring it, otherwise anyone could hijack another account's connection.
    let uid = user.id;
    if (target_user_id && target_user_id !== user.id) {
      const admin = await isAdminUser(user.id);
      if (!admin) return json({ error: "Forbidden" }, 403);
      uid = target_user_id;
    }

    const state = btoa(JSON.stringify({ uid, redirect_to }));

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SCOPES);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", state);

    return json({ url: url.toString() });
  } catch (err) {
    console.error("google-oauth-start error", err);
    return json({ error: String(err?.message ?? err) }, 500);
  }
});
