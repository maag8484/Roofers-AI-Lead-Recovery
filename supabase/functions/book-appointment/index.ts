// Books an appointment: creates a Google Calendar event and inserts an
// appointments row (which streams to the dashboard via Realtime).
// Called by n8n — authenticate with the X-Api-Key shared secret.
// Deploy with --no-verify-jwt.
import { handleOptions, json } from "../_shared/cors.ts";
import { serviceClient, decrypt } from "../_shared/supabase.ts";

const N8N_API_KEY = Deno.env.get("N8N_SHARED_SECRET")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

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
    const body = await req.json();
    const {
      user_id,
      lead_name,
      lead_phone,
      lead_email,
      property_address,
      service_type,
      selected_slot, // ISO string
    } = body;

    if (!user_id || !selected_slot) {
      return json({ error: "user_id and selected_slot required" }, 400);
    }

    const db = serviceClient();

    // Fetch settings for duration + the calendar connection.
    const [{ data: settings }, { data: conn }] = await Promise.all([
      db.from("availability_settings").select("inspection_duration_minutes").eq("user_id", user_id).maybeSingle(),
      db.from("calendar_connections").select("refresh_token, calendar_id").eq("user_id", user_id).maybeSingle(),
    ]);

    const duration = settings?.inspection_duration_minutes ?? 60;
    const start = new Date(selected_slot);
    const end = new Date(start.getTime() + duration * 60000);

    let googleEventId: string | null = null;
    if (conn?.refresh_token) {
      const token = await freshAccessToken(await decrypt(conn.refresh_token));
      if (token) {
        const calId = conn.calendar_id ?? "primary";
        const evRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              summary: `Roof Inspection — ${lead_name ?? "Lead"}`,
              description: [
                `Service: ${service_type ?? "n/a"}`,
                `Phone: ${lead_phone ?? "n/a"}`,
                `Email: ${lead_email ?? "n/a"}`,
                `Booked by Roof AI Lead Recovery`,
              ].join("\n"),
              location: property_address ?? undefined,
              start: { dateTime: start.toISOString() },
              end: { dateTime: end.toISOString() },
            }),
          }
        );
        if (evRes.ok) googleEventId = (await evRes.json()).id ?? null;
        else console.error("Calendar event create failed", await evRes.text());
      }
    }

    const { data: appt, error } = await db
      .from("appointments")
      .insert({
        user_id,
        lead_name,
        lead_phone,
        lead_email,
        property_address,
        service_type,
        scheduled_time: start.toISOString(),
        status: "booked",
        source: "missed_call",
      })
      .select("id")
      .single();

    if (error) return json({ error: error.message }, 500);

    return json({ success: true, appointment_id: appt.id, google_event_id: googleEventId });
  } catch (err) {
    console.error("book-appointment error", err);
    return json({ error: String(err?.message ?? err) }, 500);
  }
});
