import crypto from "node:crypto";

const MAX_BODY_BYTES = 16_384;
const MAX_REQUESTS_PER_HOUR = 5;
const SUPABASE_TIMEOUT_MS = 8_000;
const EMAIL_TIMEOUT_MS = 2_500;

const text = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";

export const AI_DEMO_CONSENT_VERSION = "ai-demo-call-v1";
// Keep the visible disclosure in site.js identical; the DOM tests check this.
export const AI_DEMO_CONSENT_TEXT = "By checking this box and submitting with my full name as my electronic signature, I authorize Roof AI Lead Recovery to call the phone number I entered once to demonstrate and discuss its revenue-recovery services using an AI-generated (artificial) voice. I confirm I am the subscriber or customary user of this number. Consent is optional and is not a condition of an audit or purchase. I can withdraw consent before the call by emailing cory@roofaileadrecovery.com, or ask not to be called during the call.";

export function normalizeDemoPhone(value) {
  if (typeof value !== "string" || value.trim().length > 30) return null;
  const raw = text(value, 30);
  if (!/^\+?[\d\s().-]+$/.test(raw)) return null;
  const digits = raw.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (raw.startsWith("+") && (digits.length !== 11 || !digits.startsWith("1"))) return null;
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(national) ? `+1${national}` : null;
}

export function validateAuditRequest(input) {
  const data = input && typeof input === "object" ? input : {};
  const payload = {
    full_name: text(data.fullName, 100),
    email: text(data.email, 254).toLowerCase(),
    company: text(data.company, 150),
    service_area: text(data.serviceArea, 150),
    phone: text(data.phone, 30) || null,
    preferred_contact: text(data.preferredContact, 20).toLowerCase(),
    current_process: text(data.currentProcess, 500) || null,
    contact_consent: data.contactConsent === true,
    marketing_consent: data.marketingConsent === true,
    ai_demo_requested: data.aiDemoRequested === true,
    ai_demo_consent: null,
    consent_version: "audit-form-v2",
    consented_at: new Date().toISOString(),
    submission_page: text(data.submissionPage, 500),
    attribution: sanitizeObject(data.attribution, ["landing_page", "referrer", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"], 500),
    calculator: sanitizeCalculator(data.calculator),
  };

  const errors = [];
  if (!payload.full_name) errors.push("fullName");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) errors.push("email");
  if (!payload.company) errors.push("company");
  if (!payload.service_area) errors.push("serviceArea");
  if (!["email", "phone"].includes(payload.preferred_contact)) errors.push("preferredContact");
  if (payload.preferred_contact === "phone" && !payload.phone) errors.push("phone");
  if (!payload.contact_consent) errors.push("contactConsent");
  if (data.aiDemoRequested !== undefined && typeof data.aiDemoRequested !== "boolean") errors.push("aiDemoRequested");
  if (payload.ai_demo_requested) {
    const phone = normalizeDemoPhone(data.phone);
    if (!phone && !errors.includes("phone")) errors.push("phone");
    if (data.aiDemoConsentVersion !== AI_DEMO_CONSENT_VERSION) errors.push("aiDemoConsentVersion");
    if (phone && payload.full_name && data.aiDemoConsentVersion === AI_DEMO_CONSENT_VERSION) {
      // The client supplies only an affirmative choice and the displayed version.
      // Wording, scope and signature identity are generated from validated fields;
      // the database adds its own timestamp when the evidence is committed.
      payload.ai_demo_consent = {
        version: AI_DEMO_CONSENT_VERSION,
        text: AI_DEMO_CONSENT_TEXT,
        phone_e164: phone,
        signer_name: payload.full_name,
        scope: "roof_ai_ai_voice_sales_demo",
        max_calls: 1,
        method: "checkbox_and_typed_name",
        submission_page: payload.submission_page,
      };
    }
  }
  return { payload, errors };
}

function sanitizeObject(value, keys, max) {
  const source = value && typeof value === "object" ? value : {};
  return Object.fromEntries(keys.map((key) => [key, text(source[key], max)]).filter(([, value]) => value));
}

function sanitizeCalculator(value) {
  if (!value || typeof value !== "object") return {};
  const number = (key, max) => Math.min(max, Math.max(0, Number(value[key]) || 0));
  return {
    missed_calls: number("missedCalls", 100000),
    legitimate_rate: number("legitimateRate", 100),
    close_rate: number("closeRate", 100),
    job_value: number("jobValue", 100000000),
    monthly_risk: number("monthlyRisk", 1000000000),
    annual_risk: number("annualRisk", 12000000000),
  };
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  return text(Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0] || req.socket?.remoteAddress, 100);
}

function requestOriginAllowed(req) {
  const origin = text(req.headers.origin, 500);
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    const requestHost = text(req.headers["x-forwarded-host"] || req.headers.host, 255);
    return Boolean(requestHost) && originHost === requestHost;
  } catch {
    return false;
  }
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Length", Buffer.byteLength(payload));
  res.end(payload);
}

function notificationText(payload, requestId) {
  const calculator = payload.calculator || {};
  const money = (value) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
  return [
    "New missed revenue audit request",
    "",
    `Request ID: ${requestId}`,
    `Name: ${payload.full_name}`,
    `Work email: ${payload.email}`,
    `Roofing company: ${payload.company}`,
    `Service area: ${payload.service_area}`,
    `Phone: ${payload.phone || "Not provided"}`,
    `Preferred follow-up: ${payload.preferred_contact}`,
    `AI demo request: ${payload.ai_demo_requested ? "Requested — review required before calling" : "Not requested"}`,
    ...(payload.ai_demo_requested ? [
      `AI demo number: ${payload.ai_demo_consent.phone_e164}`,
      `AI demo consent version: ${payload.ai_demo_consent.version}`,
      "Review the saved consent, number ownership, suppression and calling eligibility in the admin inbox. This request does not authorize automatic dispatch.",
    ] : []),
    `Current missed-call process: ${payload.current_process || "Not provided"}`,
    "",
    "Calculator scenario:",
    `Missed calls/month: ${calculator.missed_calls || 0}`,
    `Modeled monthly gross revenue at risk: ${money(calculator.monthly_risk)}`,
    `Modeled annual gross revenue at risk: ${money(calculator.annual_risk)}`,
    "",
    "Attribution:",
    `Source: ${payload.attribution?.utm_source || "direct"}`,
    `Medium: ${payload.attribution?.utm_medium || "none"}`,
    `Campaign: ${payload.attribution?.utm_campaign || "none"}`,
    `Content: ${payload.attribution?.utm_content || "none"}`,
    `Submission page: ${payload.submission_page || "Unknown"}`,
  ].join("\n");
}

async function sendAuditNotification(payload, requestId) {
  const rawApiKey = process.env.SENDGRID_API_KEY || "";
  const trimmedKey = rawApiKey.trim();
  const quoted = trimmedKey.match(/^(["'])(.*)\1$/s);
  const apiKey = quoted ? quoted[2].trim() : trimmedKey;
  if (!apiKey) return { sent: false, reason: "NOT_CONFIGURED" };

  const to = process.env.AUDIT_NOTIFICATION_TO || "cory@roofaileadrecovery.com";
  const from = process.env.AUDIT_NOTIFICATION_FROM || process.env.SENDGRID_FROM_EMAIL || "support@roofaileadrecovery.com";
  const configuredBase = (process.env.SENDGRID_API_BASE_URL || "").trim().replace(/\/$/, "");
  const baseUrls = configuredBase
    ? [configuredBase]
    : ["https://api.sendgrid.com", "https://api.eu.sendgrid.com"];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS);
  try {
    const body = JSON.stringify({
      personalizations: [{ to: [{ email: to }], subject: `[Roof AI] New audit request — ${payload.company}` }],
      from: { email: from, name: "Roof AI Lead Recovery" },
      reply_to: { email: payload.email, name: payload.full_name },
      content: [{ type: "text/plain", value: notificationText(payload, requestId) }],
    });
    const statuses = [];
    for (const baseUrl of baseUrls) {
      const response = await fetch(`${baseUrl}/v3/mail/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body,
        signal: controller.signal,
      });
      statuses.push(response.status);
      if (response.ok) return { sent: true };
      if (response.status !== 401) break;
    }
    console.error("[audit-request] Notification email failed", statuses.join(","), {
      keyPrefixValid: apiKey.startsWith("SG."),
      keyLength: apiKey.length,
      whitespaceRemoved: rawApiKey !== trimmedKey || Boolean(quoted),
    });
    return { sent: false, reason: "PROVIDER_ERROR" };
  } catch (error) {
    console.error("[audit-request] Notification email failed", error instanceof Error ? error.message : "unknown");
    return { sent: false, reason: "PROVIDER_ERROR" };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  }
  if (!requestOriginAllowed(req)) return json(res, 403, { ok: false, error: "ORIGIN_NOT_ALLOWED" });

  const bodySize = Buffer.byteLength(JSON.stringify(req.body || {}));
  if (bodySize > MAX_BODY_BYTES) return json(res, 413, { ok: false, error: "PAYLOAD_TOO_LARGE" });

  // Honeypot submissions receive a neutral response so bots get no useful signal.
  if (text(req.body?.website, 200)) return json(res, 202, { ok: true });

  const { payload, errors } = validateAuditRequest(req.body);
  if (errors.length) return json(res, 400, { ok: false, error: "VALIDATION_ERROR", fields: errors });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const salt = process.env.AUDIT_RATE_LIMIT_SALT;
  if (!supabaseUrl || !serviceKey || !salt) {
    console.error("[audit-request] Required server configuration is missing");
    return json(res, 503, { ok: false, error: "SERVICE_UNAVAILABLE" });
  }

  const rateKey = crypto.createHmac("sha256", salt).update(`ip:${clientIp(req)}`).digest("hex");
  const emailKey = crypto.createHmac("sha256", salt).update(`email:${payload.email}`).digest("hex");
  const supabaseHeaders = {
    apikey: serviceKey,
    "Content-Type": "application/json",
  };
  // New sb_secret_* keys are opaque API keys, not JWTs. Legacy service_role
  // keys are JWTs and may still be sent as a bearer token for compatibility.
  if (serviceKey.startsWith("eyJ")) supabaseHeaders.Authorization = `Bearer ${serviceKey}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/submit_public_audit_request`, {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify({ p_request: payload, p_rate_key: rateKey, p_email_key: emailKey, p_limit: MAX_REQUESTS_PER_HOUR }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
    const result = await response.json().catch(() => ({}));
    if (response.status === 429 || result?.error === "RATE_LIMITED") {
      return json(res, 429, { ok: false, error: "RATE_LIMITED" });
    }
    if (!response.ok || !result?.id) {
      console.error("[audit-request] Supabase RPC failed", response.status, result?.message || result?.error || "unknown");
      return json(res, 502, { ok: false, error: "SUBMISSION_FAILED" });
    }
    if (payload.ai_demo_requested && result.ai_demo_consent_saved !== true) {
      // An older RPC can save the audit while silently omitting new fields.
      // Never report a captured AI request unless the updated database confirms it.
      console.error("[audit-request] AI demo consent persistence was not confirmed");
      return json(res, 502, { ok: false, error: "AI_DEMO_CONSENT_NOT_SAVED" });
    }
    const notification = await sendAuditNotification(payload, result.id);
    return json(res, 201, { ok: true, requestId: result.id, notificationSent: notification.sent, ...(payload.ai_demo_requested ? { aiDemoRequested: true } : {}) });
  } catch (error) {
    console.error("[audit-request] Submission failed", error instanceof Error ? error.message : "unknown");
    return json(res, 502, { ok: false, error: "SUBMISSION_FAILED" });
  }
}
