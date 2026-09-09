import test from "node:test";
import assert from "node:assert/strict";
import handler, { validateAuditRequest } from "../api/audit-request.js";
import cleanupHandler from "../api/cron/purge-audit-requests.js";

const valid = {
  fullName: "Jamie Roofer",
  email: "Jamie@Example.com",
  company: "Example Roofing",
  serviceArea: "Columbus, OH",
  preferredContact: "Email",
  contactConsent: true,
  attribution: { utm_source: "linkedin", unexpected: "discard me" },
  calculator: { missedCalls: 20, legitimateRate: 50, closeRate: 25, jobValue: 10000 },
};

function responseDouble() {
  return {
    statusCode: 200, headers: {}, body: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(key, value) { this.headers[key] = value; return this; },
    json(body) { this.body = body; return this; },
    end(body) { this.body = body ? JSON.parse(body) : null; return this; },
  };
}

test("validation normalizes and allowlists public input", () => {
  const { payload, errors } = validateAuditRequest(valid);
  assert.deepEqual(errors, []);
  assert.equal(payload.email, "jamie@example.com");
  assert.equal(payload.preferred_contact, "email");
  assert.deepEqual(payload.attribution, { utm_source: "linkedin" });
  assert.equal(payload.contact_consent, true);
});

test("validation rejects missing consent and phone preference without phone", () => {
  const { errors } = validateAuditRequest({ ...valid, preferredContact: "Phone", contactConsent: false });
  assert.ok(errors.includes("phone"));
  assert.ok(errors.includes("contactConsent"));
});

test("honeypot returns neutral acceptance without backend configuration", async () => {
  const res = responseDouble();
  await handler({ method: "POST", body: { website: "spam.example" }, headers: {}, socket: {} }, res);
  assert.equal(res.statusCode, 202);
  assert.deepEqual(res.body, { ok: true });
});

test("valid request calls the Supabase RPC and returns its request id", async (t) => {
  const oldFetch = global.fetch;
  const oldEnv = { ...process.env };
  process.env.SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  process.env.AUDIT_RATE_LIMIT_SALT = "test-salt";
  let rpcBody;
  global.fetch = async (url, options) => {
    assert.equal(url, "https://project.supabase.co/rest/v1/rpc/submit_public_audit_request");
    assert.equal(options.headers.Authorization, undefined);
    rpcBody = JSON.parse(options.body);
    return { ok: true, status: 200, json: async () => ({ id: "request-123" }) };
  };
  t.after(() => { global.fetch = oldFetch; process.env = oldEnv; });

  const res = responseDouble();
  await handler({ method: "POST", body: valid, headers: { "x-forwarded-for": "203.0.113.5" }, socket: {} }, res);
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, { ok: true, requestId: "request-123", notificationSent: false });
  assert.equal(rpcBody.p_limit, 5);
  assert.equal(rpcBody.p_request.company, "Example Roofing");
  assert.match(rpcBody.p_rate_key, /^[a-f0-9]{64}$/);
  assert.match(rpcBody.p_email_key, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(rpcBody).includes("203.0.113.5"), false);
});

test("accepted requests send an internal notification when SendGrid is configured", async (t) => {
  const oldFetch = global.fetch;
  const oldEnv = { ...process.env };
  process.env.SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  process.env.AUDIT_RATE_LIMIT_SALT = "test-salt";
  process.env.SENDGRID_API_KEY = "test-sendgrid-key";
  process.env.AUDIT_NOTIFICATION_FROM = "verified@roofaileadrecovery.com";
  process.env.AUDIT_NOTIFICATION_TO = "cory@roofaileadrecovery.com";
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.includes("/rest/v1/rpc/")) {
      return { ok: true, status: 200, json: async () => ({ id: "request-456" }) };
    }
    return { ok: true, status: 202 };
  };
  t.after(() => { global.fetch = oldFetch; process.env = oldEnv; });

  const res = responseDouble();
  await handler({ method: "POST", body: valid, headers: { "x-forwarded-for": "203.0.113.6" }, socket: {} }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.notificationSent, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, "https://api.sendgrid.com/v3/mail/send");
  const email = JSON.parse(calls[1].options.body);
  assert.equal(email.personalizations[0].to[0].email, "cory@roofaileadrecovery.com");
  assert.equal(email.reply_to.email, "jamie@example.com");
  assert.match(email.content[0].value, /Example Roofing/);
});

test("cross-origin browser submission is rejected", async () => {
  const res = responseDouble();
  await handler({ method: "POST", body: valid, headers: { origin: "https://evil.example", host: "www.roofaileadrecovery.com" }, socket: {} }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, "ORIGIN_NOT_ALLOWED");
});

test("method and malformed requests fail closed", async () => {
  const wrongMethod = responseDouble();
  await handler({ method: "GET", body: {}, headers: {}, socket: {} }, wrongMethod);
  assert.equal(wrongMethod.statusCode, 405);
  const malformed = responseDouble();
  await handler({ method: "POST", body: {}, headers: {}, socket: {} }, malformed);
  assert.equal(malformed.statusCode, 400);
  assert.equal(malformed.body.error, "VALIDATION_ERROR");
});

test("retention cleanup requires the cron bearer secret", async () => {
  const oldSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "expected-secret";
  const res = responseDouble();
  await cleanupHandler({ method: "GET", headers: { authorization: "Bearer wrong-secret" } }, res);
  assert.equal(res.statusCode, 401);
  if (oldSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = oldSecret;
});
