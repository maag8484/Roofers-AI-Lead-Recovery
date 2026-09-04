import crypto from "node:crypto";

const MAX_BODY_BYTES = 16_384;
const MAX_REQUESTS_PER_HOUR = 5;

const text = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";

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

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json").setHeader("Cache-Control", "no-store").json(body);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  }

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

  const rateKey = crypto.createHash("sha256").update(`${salt}:${clientIp(req)}`).digest("hex");
  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/submit_public_audit_request`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_request: payload, p_rate_key: rateKey, p_limit: MAX_REQUESTS_PER_HOUR }),
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 429 || result?.error === "RATE_LIMITED") {
      return json(res, 429, { ok: false, error: "RATE_LIMITED" });
    }
    if (!response.ok || !result?.id) {
      console.error("[audit-request] Supabase RPC failed", response.status, result?.message || result?.error || "unknown");
      return json(res, 502, { ok: false, error: "SUBMISSION_FAILED" });
    }
    return json(res, 201, { ok: true, requestId: result.id });
  } catch (error) {
    console.error("[audit-request] Submission failed", error instanceof Error ? error.message : "unknown");
    return json(res, 502, { ok: false, error: "SUBMISSION_FAILED" });
  }
}
