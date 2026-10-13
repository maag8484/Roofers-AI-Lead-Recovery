import crypto from "node:crypto";

export const PRODUCTION_ASSISTANT = "5709d567-a970-4534-831a-6ac6f0609fc0";
export const INTERNAL_ASSISTANT = "ef0931f3-859d-48ff-9a1e-205c5afbbddf";
export const TEMPLATE_VERSION = "requested-signup-v1";
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;
const OPT_OUT = /\b(?:do not|don't|dont|stop|no more|remove|unsubscribe|wrong number|not interested|no thanks|no thank you|changed my mind|never mind|nevermind)\b/i;
const YES = /^(?:yes|yes please|correct|that is correct|that's correct|sure|please do|go ahead|absolutely|yep|yeah)[.!\s]*$/i;

export class Hold extends Error {
  constructor(code, status = 409) { super(code); this.code = code; this.status = status; }
}
export function requireCondition(value, code, status) { if (!value) throw new Hold(code, status); }
export function validEmail(value) { return typeof value === "string" && value.length <= 254 && EMAIL.test(value); }
export function normalizePhone(value) {
  if (typeof value !== "string" || !/^\+?[\d\s().-]+$/.test(value)) return "";
  const digits = value.replace(/\D/g, "");
  return /^1[2-9]\d{2}[2-9]\d{6}$/.test(digits) ? `+${digits}` : /^[2-9]\d{2}[2-9]\d{6}$/.test(digits) ? `+1${digits}` : "";
}
export function authenticated(header, secret) {
  if (typeof secret !== "string" || secret.length < 32 || typeof header !== "string") return false;
  const expected = Buffer.from(`Bearer ${secret}`), supplied = Buffer.from(header);
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}
function speech(value) {
  return value.toLowerCase().replace(/\bat\b/g, "@").replace(/\bdot\b/g, ".")
    .replace(/\b(?:hyphen|dash)\b/g, "-").replace(/\bunderscore\b/g, "_").replace(/\s/g, "");
}
export function verifyEmailRequest(call, email) {
  // Only actual provider message roles are accepted. Never accept model extraction
  // flags, text from the request body, or a guessed email as permission evidence.
  const raw = call.artifact?.messages ?? call.messages;
  requireCondition(Array.isArray(raw), "CALL_MESSAGES_MISSING");
  const messages = raw.filter(m => ["assistant", "bot", "user"].includes(m.role)).map(m => ({
    role: m.role === "user" ? "user" : "assistant", text: typeof m.message === "string" ? m.message : m.content,
  }));
  requireCondition(messages.every(m => typeof m.text === "string"), "CALL_MESSAGES_INVALID");
  requireCondition(!messages.some(m => m.role === "user" && OPT_OUT.test(m.text)), "CALL_DECLINED_OR_OPTED_OUT");
  for (let i = messages.length - 2; i >= 0; i--) {
    const question = messages[i], answer = messages[i + 1];
    if (question.role !== "assistant" || answer.role !== "user") continue;
    if (!/\bemail\b/i.test(question.text) || !/\b(?:signup|sign.up|trial)\b/i.test(question.text) ||
        !/\blink\b/i.test(question.text) || !question.text.includes("?") || OPT_OUT.test(question.text)) continue;
    // Normalize spoken punctuation, but require the whole address with boundaries.
    const normalized = speech(question.text);
    const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`^mayiemailthesignuplinkto${escaped}\\?$`).test(normalized)) continue;
    if (!YES.test(answer.text.trim())) continue;
    // Later substantive user content may correct the address/revoke the request.
    // Leave such calls for review instead of trusting an earlier yes.
    const later = messages.slice(i + 2).filter(m => m.role === "user");
    if (later.some(m => !/^(?:thanks|thank you|bye|goodbye|that's all|that is all|have a good day)[.!\s]*$/i.test(m.text.trim()))) continue;
    return { question: question.text, answer: answer.text, message_index: i };
  }
  throw new Hold("EXPLICIT_EMAIL_SIGNUP_REQUEST_NOT_PROVED");
}

export function validateSource(call, audit, { mode, testTo, now }) {
  requireCondition(call.status === "ended" && UUID.test(call.id || ""), "CALL_NOT_FINALIZED");
  const ended = Date.parse(call.endedAt), started = Date.parse(call.startedAt);
  requireCondition(Number.isFinite(ended) && Number.isFinite(started) && started <= ended &&
    ended <= now + 5000 && now - ended <= 86400000, "CALL_TIME_INVALID_OR_EXPIRED");
  const test = mode === "test";
  requireCondition(call.assistantId === (test ? INTERNAL_ASSISTANT : PRODUCTION_ASSISTANT), "ASSISTANT_NOT_ALLOWED");
  let email, phone = normalizePhone(call.customer?.number);
  if (test) {
    requireCondition(validEmail(testTo) && !/@example\.(?:com|org|net)$/i.test(testTo), "TEST_RECIPIENT_NOT_CONFIGURED");
    email = testTo.toLowerCase();
  } else {
    requireCondition(audit && audit.id === call.metadata?.audit_request_id, "CALL_REQUEST_MISMATCH");
    const consent = audit.ai_demo_consent;
    requireCondition(audit.ai_demo_requested === true && audit.contact_consent === true &&
      !["spam", "closed"].includes(audit.status), "REQUEST_NOT_ELIGIBLE");
    const signed = Date.parse(consent?.signed_at);
    requireCondition(consent?.version === "ai-demo-call-v1" && consent?.scope === "roof_ai_ai_voice_sales_demo" &&
      consent?.max_calls === 1 && consent?.text && consent?.signer_name &&
      Number.isFinite(signed) && signed <= started && !consent?.revoked_at, "VOICE_PERMISSION_NOT_PROVED");
    requireCondition(phone && phone === normalizePhone(consent.phone_e164) && phone === normalizePhone(audit.phone), "CALL_NUMBER_MISMATCH");
    email = typeof audit.email === "string" ? audit.email.toLowerCase() : "";
    requireCondition(validEmail(email) && !/@example\.(?:com|org|net)$/i.test(email) && !/^\+1\d{3}55501\d{2}$/.test(phone), "RECIPIENT_NOT_ELIGIBLE");
  }
  const confirmation = verifyEmailRequest(call, email);
  return { source_call_id: call.id, audit_request_id: test ? null : audit.id, recipient: email,
    phone_e164: phone, test_mode: test, confirmation, template_version: TEMPLATE_VERSION };
}

export function validateSuppressionCheck(check, row, now) {
  const checked = Date.parse(check?.checked_at);
  requireCondition(check?.phone_clear === true && check?.email_clear === true && check?.revocation_clear === true &&
    check?.source_call_id === row.source_call_id && check?.email === row.recipient &&
    check?.phone_e164 === row.phone_e164 && Number.isFinite(checked) &&
    checked <= now + 5000 && now - checked <= 30000, "FRESH_SUPPRESSION_REVIEW_REQUIRED");
}

export function signupEmail(row, deliveryId, from) {
  const url = new URL("https://www.roofaileadrecovery.com/signup");
  url.searchParams.set("utm_source", "vapi");
  url.searchParams.set("utm_medium", "requested_email");
  url.searchParams.set("utm_campaign", TEMPLATE_VERSION);
  // No email, phone, consent record, or call ID is exposed in the public URL.
  return {
    personalizations: [{ to: [{ email: row.recipient }], subject: `${row.test_mode ? "[Internal test] " : ""}Your Roof AI signup link`,
      custom_args: { roof_ai_followup_id: deliveryId } }],
    from: { email: from, name: "Roof AI Lead Recovery" },
    reply_to: { email: "cory@roofaileadrecovery.com", name: "Cory" },
    content: [{ type: "text/plain", value: [
      "Here is the signup link you requested during your Roof AI demonstration:", "", url.toString(), "",
      "Create your account, then start the seven-day free trial. The plan is $299/month plus applicable tax after the trial unless you cancel. Review your billing date and cancellation terms at checkout.", "",
      "Your team keeps its existing number. Service starts after intake, missed-call forwarding, and your call-handling settings are confirmed. Booking depends on the scheduling connection and rules you choose.", "",
      "Questions? Reply to this email. If you no longer want follow-up, reply no thanks.", "", "Cory", "Roof AI Lead Recovery",
    ].join("\n") }],
    tracking_settings: { click_tracking: { enable: false, enable_text: false }, open_tracking: { enable: false } },
  };
}

export function database(env, fetcher = fetch) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: key, "Content-Type": "application/json" };
  if (key?.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  const origin = env.SUPABASE_URL?.replace(/\/$/, "");
  return async (path, method = "GET", body) => {
    const res = await fetcher(`${origin}/rest/v1/${path}`, { method, headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(8000) });
    requireCondition(res.ok, "DATABASE_ERROR", 503);
    return res.json();
  };
}

export async function providerSuppressionCheck(email, env, fetcher = fetch) {
  const base = env.SENDGRID_API_BASE_URL || "https://api.sendgrid.com";
  requireCondition(["https://api.sendgrid.com", "https://api.eu.sendgrid.com"].includes(base), "SENDGRID_ORIGIN_INVALID", 503);
  for (const path of ["asm/suppressions/global", "suppression/bounces", "suppression/spam_reports", "suppression/invalid_emails"]) {
    const res = await fetcher(`${base}/v3/${path}/${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${env.SENDGRID_API_KEY}` }, signal: AbortSignal.timeout(4000),
    });
    // A 404 can mean a wrong route/permission configuration. Only an explicit
    // successful empty response establishes that the address is not suppressed.
    requireCondition(res.ok, "EMAIL_SUPPRESSION_LOOKUP_FAILED", 503);
    const value = await res.json();
    const empty = Array.isArray(value) ? value.length === 0 : value && typeof value === "object" && Object.keys(value).length === 0;
    requireCondition(empty, "EMAIL_PROVIDER_SUPPRESSED");
  }
}

export function json(res, status, value) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(value));
}
