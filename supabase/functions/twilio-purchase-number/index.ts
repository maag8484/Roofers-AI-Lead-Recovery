// Purchases a Twilio number, wires the n8n voice webhook, and stores it.
import { handleOptions, json } from "../_shared/cors.ts";
import { getUser, serviceClient } from "../_shared/supabase.ts";

const ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const N8N_VOICE_WEBHOOK = Deno.env.get("N8N_VOICE_WEBHOOK_URL") ?? "";

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  try {
    const { user } = await getUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { phone_number } = await req.json();
    if (!phone_number) return json({ error: "phone_number required" }, 400);

    const form = new URLSearchParams({ PhoneNumber: phone_number });
    // Point inbound calls/SMS at the n8n workflow that runs the AI agent.
    if (N8N_VOICE_WEBHOOK) {
      form.set("VoiceUrl", N8N_VOICE_WEBHOOK);
      form.set("VoiceMethod", "POST");
    }

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form,
      }
    );
    if (!res.ok) {
      const text = await res.text();
      return json({ error: "Twilio purchase failed", detail: text }, 502);
    }
    const data = await res.json();

    const db = serviceClient();
    await db.from("twilio_accounts").upsert(
      {
        user_id: user.id,
        phone_number: data.phone_number,
        twilio_sid: data.sid,
        friendly_name: data.friendly_name,
      },
      { onConflict: "user_id" }
    );
    await db.from("roofing_companies").update({ setup_step: 4 }).eq("user_id", user.id);

    return json({ phone_number: data.phone_number, sid: data.sid });
  } catch (err) {
    console.error("twilio-purchase-number error", err);
    return json({ error: String(err?.message ?? err) }, 500);
  }
});
