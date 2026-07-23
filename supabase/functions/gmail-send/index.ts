// Sends an email via the connected workspace Gmail account. Admin-gated (JWT on).
// Production-shaped: accepts { to, subject, html, text?, metadata? }, validates,
// enforces a daily cap read from admin_settings (env fallback, fail-closed), and
// returns a STRUCTURED result so callers can log/handle errors:
//   { ok: true,  message_id }
//   { ok: false, reason: 'RATE_LIMITED' | 'GMAIL_ERROR' | 'AUTH_ERROR', detail }
//
// ORDER MATTERS: the cap is checked BEFORE any Gmail API call.
import { handleOptions, json } from "../_shared/cors.ts";
import { getUser, isAdminUser, serviceClient } from "../_shared/supabase.ts";
import { refreshAccessToken, sendGmail } from "../_shared/gmail.ts";

const GMAIL_FROM = Deno.env.get("GMAIL_FROM") ?? "me";

// Resolve the daily cap: admin_settings.daily_send_cap first, then env
// DAILY_SEND_CAP, default 500. FAIL CLOSED — if the resolved cap is 0 (or
// negative / unparseable), no send is allowed. A "no cap" fallthrough would be a
// real production risk, so absence resolves to a positive default, and an
// explicit 0 blocks.
function resolveCap(dbCap: number | null | undefined): number {
  if (typeof dbCap === "number" && Number.isFinite(dbCap)) return dbCap; // includes 0 => blocks
  const envRaw = Deno.env.get("DAILY_SEND_CAP");
  if (envRaw != null && envRaw !== "") {
    const n = Number(envRaw);
    return Number.isFinite(n) ? n : 0; // unparseable env => fail closed
  }
  return 500; // default
}

Deno.serve(async (req) => {
  const pre = handleOptions(req);
  if (pre) return pre;

  try {
    const { user } = await getUser(req);
    if (!user) return json({ ok: false, reason: "AUTH_ERROR", detail: "Unauthorized" }, 401);
    if (!(await isAdminUser(user.id)))
      return json({ ok: false, reason: "AUTH_ERROR", detail: "Forbidden" }, 403);

    const { to, subject, html, text, metadata } = await req.json().catch(() => ({}));

    // Validate required fields.
    if (!to || !subject || (!html && !text)) {
      return json(
        { ok: false, reason: "GMAIL_ERROR", detail: "Missing required fields (to, subject, html|text)" },
        400
      );
    }

    const db = serviceClient();
    const [{ data: statusRow }, { data: settings }] = await Promise.all([
      db
        .from("email_integration_status")
        .select("status, emails_sent_today, encrypted_refresh_token")
        .eq("id", 1)
        .maybeSingle(),
      db.from("admin_settings").select("daily_send_cap").eq("id", 1).maybeSingle(),
    ]);

    if (statusRow?.status !== "CONNECTED") {
      return json({ ok: false, reason: "AUTH_ERROR", detail: "Gmail is not connected" }, 409);
    }

    // ---- CAP CHECK (before any Gmail call), fail-closed --------------------
    const cap = resolveCap(settings?.daily_send_cap);
    const site = metadata?.site ?? "unknown";
    if (cap <= 0 || (statusRow.emails_sent_today ?? 0) >= cap) {
      await db.from("activity_logs").insert({
        action: "EMAIL_SEND_RATE_LIMITED",
        performed_by: user.id,
        result: "BLOCKED",
        status: "BLOCKED",
        metadata: { to, cap, site },
      });
      return json({ ok: false, reason: "RATE_LIMITED", detail: `Daily cap (${cap}) reached.` }, 429);
    }

    // ---- Refresh + send ---------------------------------------------------
    try {
      const { access_token } = await refreshAccessToken(statusRow.encrypted_refresh_token);
      const messageId = await sendGmail(
        access_token,
        GMAIL_FROM,
        to,
        subject,
        // Prefer text; sendGmail sends text/plain. (HTML multipart is a future
        // enhancement — for now html is accepted and its text fallback is used.)
        text || stripHtml(html)
      );

      const nowIso = new Date().toISOString();
      await db
        .from("email_integration_status")
        .update({
          last_successful_email_at: nowIso,
          emails_sent_today: (statusRow.emails_sent_today ?? 0) + 1,
          last_error: null,
        })
        .eq("id", 1);

      await db.from("activity_logs").insert({
        action: "EMAIL_SENT",
        performed_by: user.id,
        result: "OK",
        status: "OK",
        metadata: metadata ? { ...metadata, to, site } : { to, site },
      });

      return json({ ok: true, message_id: messageId ?? null });
    } catch (sendErr) {
      const msg = String((sendErr as Error)?.message ?? sendErr);
      const authFail = msg.includes("refresh") || msg.includes("invalid_grant");
      await db
        .from("email_integration_status")
        .update({ last_failed_email_at: new Date().toISOString(), last_error: msg })
        .eq("id", 1);
      await db.from("activity_logs").insert({
        action: "EMAIL_SEND_FAILED",
        performed_by: user.id,
        result: "ERROR",
        status: "ERROR",
        metadata: { to, site, message: msg },
      });
      return json(
        { ok: false, reason: authFail ? "AUTH_ERROR" : "GMAIL_ERROR", detail: msg },
        502
      );
    }
  } catch (err) {
    return json({ ok: false, reason: "GMAIL_ERROR", detail: String((err as Error)?.message ?? err) }, 500);
  }
});

// Minimal HTML->text fallback (Phase 7 sends text/plain; full multipart later).
// Uses simple, linear-time patterns (no nested quantifiers -> no backtracking).
function stripHtml(html: string): string {
  return (html ?? "")
    .replace(/<style[^>]*>/gi, "<style>")
    .replaceAll("</style>", " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t\r\n]+/g, " ")
    .trim();
}
