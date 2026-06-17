// Lists available Twilio phone numbers for a given area code.
import { handleOptions, json } from "../_shared/cors.ts";
import { getUser } from "../_shared/supabase.ts";

const ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  try {
    const { user } = await getUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { area_code } = await req.json();
    const url = new URL(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/AvailablePhoneNumbers/US/Local.json`
    );
    url.searchParams.set("AreaCode", String(area_code));
    url.searchParams.set("SmsEnabled", "true");
    url.searchParams.set("VoiceEnabled", "true");
    url.searchParams.set("PageSize", "10");

    const res = await fetch(url, {
      headers: { Authorization: "Basic " + btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`) },
    });
    if (!res.ok) {
      const text = await res.text();
      return json({ error: "Twilio search failed", detail: text }, 502);
    }
    const data = await res.json();
    const numbers = (data.available_phone_numbers ?? []).map((n: any) => ({
      phone_number: n.phone_number,
      friendly_name: n.friendly_name,
      locality: n.locality,
      region: n.region,
    }));
    return json({ numbers });
  } catch (err) {
    console.error("twilio-search-numbers error", err);
    return json({ error: String(err?.message ?? err) }, 500);
  }
});
