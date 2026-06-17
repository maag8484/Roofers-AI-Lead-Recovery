// Returns open inspection slots for a user, derived from their availability
// settings minus existing Google Calendar events.
// Called by n8n — authenticate with the X-Api-Key shared secret.
// Deploy with --no-verify-jwt.
import { handleOptions, json } from "../_shared/cors.ts";
import { serviceClient, decrypt } from "../_shared/supabase.ts";

const N8N_API_KEY = Deno.env.get("N8N_SHARED_SECRET")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// Refresh an expired Google access token using the stored refresh token.
async function freshAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  return (await res.json()).access_token ?? null;
}

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  if (req.headers.get("X-Api-Key") !== N8N_API_KEY) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const { user_id, daysAhead = 5 } = await req.json();
    if (!user_id) return json({ error: "user_id required" }, 400);

    const db = serviceClient();
    const { data: settings } = await db
      .from("availability_settings")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();
    if (!settings) return json({ slots: [] });

    const duration = settings.inspection_duration_minutes ?? 60;

    // Pull busy windows from Google Calendar if connected.
    let busy: { start: string; end: string }[] = [];
    const { data: conn } = await db
      .from("calendar_connections")
      .select("refresh_token, calendar_id")
      .eq("user_id", user_id)
      .maybeSingle();

    const now = new Date();
    const timeMax = new Date(now.getTime() + daysAhead * 86400000);

    if (conn?.refresh_token) {
      const token = await freshAccessToken(await decrypt(conn.refresh_token));
      if (token) {
        const fb = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            timeMin: now.toISOString(),
            timeMax: timeMax.toISOString(),
            items: [{ id: conn.calendar_id ?? "primary" }],
          }),
        });
        if (fb.ok) {
          const data = await fb.json();
          const cal = data.calendars?.[conn.calendar_id ?? "primary"];
          busy = cal?.busy ?? [];
        }
      }
    }

    // Walk each day, build candidate slots, skip ones overlapping busy windows.
    const slots: { start: string; dateTime: string }[] = [];
    for (let d = 0; d < daysAhead && slots.length < 6; d++) {
      const day = new Date(now);
      day.setDate(now.getDate() + d);
      const key = DAY_KEYS[day.getDay()];
      const startStr = settings[`${key}_start`];
      const endStr = settings[`${key}_end`];
      if (!startStr || !endStr) continue;

      let cursor = atTime(day, startStr);
      const dayEnd = atTime(day, endStr);
      const lunchStart = settings.lunch_start ? atTime(day, settings.lunch_start) : null;
      const lunchEnd = settings.lunch_end ? atTime(day, settings.lunch_end) : null;

      while (cursor.getTime() + duration * 60000 <= dayEnd.getTime() && slots.length < 6) {
        const slotEnd = new Date(cursor.getTime() + duration * 60000);
        const inPast = cursor <= now;
        const inLunch =
          lunchStart && lunchEnd && cursor < lunchEnd && slotEnd > lunchStart;
        const isBusy = busy.some(
          (b) => cursor < new Date(b.end) && slotEnd > new Date(b.start)
        );
        if (!inPast && !inLunch && !isBusy) {
          slots.push({
            start: cursor.toLocaleString("en-US", {
              weekday: "long",
              hour: "numeric",
              minute: "2-digit",
            }),
            dateTime: cursor.toISOString(),
          });
        }
        cursor = slotEnd;
      }
    }

    return json({ slots });
  } catch (err) {
    console.error("check-availability error", err);
    return json({ error: String(err?.message ?? err) }, 500);
  }
});

function atTime(day: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(day);
  d.setHours(h, m ?? 0, 0, 0);
  return d;
}
