import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import handler, { AI_DEMO_CONSENT_TEXT, AI_DEMO_CONSENT_VERSION, normalizeDemoPhone, validateAuditRequest } from "../api/audit-request.js";

const valid = {
  fullName: "Jamie Roofer", email: "jamie@example.com", company: "Example Roofing",
  serviceArea: "Columbus, OH", preferredContact: "Email", contactConsent: true,
  phone: "(614) 555-0123", aiDemoRequested: true, aiDemoConsentVersion: AI_DEMO_CONSENT_VERSION,
  submissionPage: "https://www.roofaileadrecovery.com/roofing-revenue-recovery/",
};
const html = await readFile(new URL("../public/roofing-revenue-recovery/index.html", import.meta.url), "utf8");
const script = await readFile(new URL("../public/revenue-recovery-assets/site.js", import.meta.url), "utf8");
const accepted = () => ({ ok: true, status: 201, json: async () => ({ ok: true, requestId: "test-request", aiDemoRequested: true }) });

function page(t, fetchImpl = async () => accepted()) {
  const dom = new JSDOM(html, { runScripts: "outside-only", url: valid.submissionPage });
  t.after(() => dom.window.close());
  const w = dom.window;
  w.fetch = fetchImpl;
  w.eval(script);
  const form = w.document.querySelector("[data-audit-form]");
  for (const key of ["fullName", "email", "company", "serviceArea"]) form.elements[key].value = valid[key];
  form.elements.contactConsent.checked = true;
  return { w, form, change: (element) => element.dispatchEvent(new w.Event("change", { bubbles: true })) };
}
async function submit(w, form) {
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await new Promise((resolve) => setTimeout(resolve, 10));
}
const events = (w, event) => (w.dataLayer || []).filter((e) => e.event === event);

test("ordinary audit, phone preference and marketing opt-in do not create AI permission", () => {
  for (const choice of [undefined, false]) {
    const { payload, errors } = validateAuditRequest({ ...valid, aiDemoRequested: choice, preferredContact: "Phone", marketingConsent: true, aiDemoConsent: { approved: true } });
    assert.deepEqual(errors, []);
    assert.equal(payload.ai_demo_requested, false);
    assert.equal(payload.ai_demo_consent, null);
  }
  assert.ok(validateAuditRequest({ ...valid, aiDemoRequested: "true" }).errors.includes("aiDemoRequested"));
});

test("AI permission requires the current disclosure, name and valid phone even for email follow-up", () => {
  for (const phone of ["", "555", "+44 20 7946 0958", "6145550123 ext 9", "+6145550123", "6145550123" + " ".repeat(20) + "x"]) {
    assert.ok(validateAuditRequest({ ...valid, phone }).errors.includes("phone"), phone);
  }
  assert.ok(validateAuditRequest({ ...valid, aiDemoConsentVersion: "old-copy" }).errors.includes("aiDemoConsentVersion"));
  assert.ok(validateAuditRequest({ ...valid, fullName: "" }).errors.includes("fullName"));
});

test("phone formats normalize to the same target without accepting extensions", () => {
  for (const phone of ["6145550123", "(614) 555-0123", "+1 614-555-0123", "1.614.555.0123"]) assert.equal(normalizeDemoPhone(phone), "+16145550123");
  for (const phone of [null, 6145550123, "161455501239", "0145550123", "6141550123", "6145550123x1"]) assert.equal(normalizeDemoPhone(phone), null);
});

test("permission evidence uses server wording, scope and signature instead of supplied evidence", () => {
  const { payload, errors } = validateAuditRequest({ ...valid, aiDemoConsent: { text: "Anything", max_calls: 99, signed_at: "1990-01-01", phone_e164: "+16145550999", verified: true } });
  assert.deepEqual(errors, []);
  assert.deepEqual(payload.ai_demo_consent, {
    version: AI_DEMO_CONSENT_VERSION, text: AI_DEMO_CONSENT_TEXT, phone_e164: "+16145550123",
    signer_name: valid.fullName, scope: "roof_ai_ai_voice_sales_demo", max_calls: 1,
    method: "checkbox_and_typed_name", submission_page: valid.submissionPage,
  });
});

test("visible permission matches saved wording, starts unchecked and leaves email audit phone optional", (t) => {
  const { w, form } = page(t);
  assert.equal(form.elements.aiDemoRequested.checked, false);
  assert.equal(form.elements.aiDemoRequested.required, false);
  assert.equal(form.elements.phone.required, false);
  assert.equal(w.document.querySelector("#audit-ai-demo-disclosure").textContent, AI_DEMO_CONSENT_TEXT);
  assert.equal(w.document.querySelector("#audit-ai-demo-disclosure").hidden, false);
});

test("checking the demo makes phone required; clearing it removes only demo validation", (t) => {
  const { w, form, change } = page(t);
  form.elements.aiDemoRequested.checked = true;
  change(form.elements.aiDemoRequested);
  assert.equal(form.elements.phone.required, true);
  assert.equal(form.checkValidity(), false);
  form.elements.phone.value = valid.phone;
  form.elements.phone.dispatchEvent(new w.Event("input", { bubbles: true }));
  assert.match(w.document.querySelector("#audit-ai-demo-number").textContent, /\+16145550123/);
  assert.equal(form.checkValidity(), true);
  form.elements.phone.value = "6145550123 ext 5";
  form.elements.phone.dispatchEvent(new w.Event("input", { bubbles: true }));
  assert.equal(form.checkValidity(), false);
  form.elements.aiDemoRequested.checked = false;
  change(form.elements.aiDemoRequested);
  assert.equal(form.elements.phone.required, false);
  assert.equal(form.checkValidity(), true);
  form.elements.preferredContact.value = "Phone";
  change(form.elements.preferredContact);
  assert.equal(form.elements.phone.required, true);
});

test("invalid demo target cannot submit or generate a conversion", async (t) => {
  let requests = 0;
  const { w, form } = page(t, async () => { requests++; return accepted(); });
  form.elements.aiDemoRequested.checked = true;
  await submit(w, form);
  assert.equal(requests, 0);
  assert.equal(events(w, "ai_demo_requested").length, 0);
});

test("accepted demo sends independent consent, records a non-PII event and resets the choice", async (t) => {
  let body;
  const { w, form } = page(t, async (url, options) => { assert.equal(url, "/api/audit-request"); body = JSON.parse(options.body); return accepted(); });
  form.elements.aiDemoRequested.checked = true;
  form.elements.phone.value = valid.phone;
  await submit(w, form);
  assert.equal(body.aiDemoRequested, true);
  assert.equal(body.aiDemoConsentVersion, AI_DEMO_CONSENT_VERSION);
  assert.equal(body.preferredContact, "Email");
  assert.equal(body.marketingConsent, false);
  assert.equal(events(w, "ai_demo_requested").length, 1);
  const event = events(w, "ai_demo_requested")[0];
  assert.equal(event.ai_demo_requested, true);
  for (const pii of [valid.phone, valid.fullName, valid.email]) assert.equal(JSON.stringify(event).includes(pii), false);
  assert.equal(form.elements.aiDemoRequested.checked, false);
  assert.equal(form.elements.phone.required, false);
  assert.match(form.querySelector("[data-audit-status]").textContent, /review your request/);
});

test("ordinary audit success never emits an AI demo conversion", async (t) => {
  let body;
  const { w, form } = page(t, async (_url, options) => { body = JSON.parse(options.body); return { ok: true, status: 201 }; });
  await submit(w, form);
  assert.equal(body.aiDemoRequested, false);
  assert.equal(body.aiDemoConsentVersion, undefined);
  assert.equal(events(w, "audit_submit").length, 1);
  assert.equal(events(w, "ai_demo_requested").length, 0);
});

test("an old API response or network failure cannot confirm AI permission or fall back to email", async (t) => {
  for (const fetchImpl of [
    async () => ({ ok: true, status: 201, json: async () => ({ requestId: "old-api" }) }),
    async () => { throw new Error("offline"); },
    async () => ({ ok: false, status: 502, json: async () => ({ error: "AI_DEMO_CONSENT_NOT_SAVED" }) }),
  ]) {
    const { w, form } = page(t, fetchImpl);
    form.elements.aiDemoRequested.checked = true;
    form.elements.phone.value = valid.phone;
    await submit(w, form);
    assert.equal(events(w, "ai_demo_requested").length, 0);
    assert.equal(events(w, "audit_submit").length, 0);
    assert.match(form.querySelector("[data-audit-status]").textContent, /couldn’t confirm/);
    assert.equal(form.querySelector(".audit-submit").disabled, false);
    assert.equal(w.location.href, valid.submissionPage);
  }
});

function mockBackend(t, result) {
  const oldEnv = { ...process.env };
  const oldFetch = global.fetch;
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
  process.env.AUDIT_RATE_LIMIT_SALT = "test-salt";
  delete process.env.SENDGRID_API_KEY;
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    assert.equal(url, "https://example.supabase.co/rest/v1/rpc/submit_public_audit_request");
    return { ok: true, status: 200, json: async () => result };
  };
  t.after(() => { global.fetch = oldFetch; process.env = oldEnv; });
  return calls;
}
async function runHandler(body) {
  const res = { statusCode: null, setHeader() {}, end(value) { this.body = JSON.parse(value); } };
  await handler({ method: "POST", headers: { "x-forwarded-for": "203.0.113.5" }, body }, res);
  return res;
}

test("API confirms the demo only after the database acknowledges saved evidence; no calls are dispatched", async (t) => {
  const calls = mockBackend(t, { id: "test-id", ai_demo_consent_saved: true });
  const res = await runHandler(valid);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.aiDemoRequested, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.p_request.ai_demo_consent.phone_e164, "+16145550123");
  assert.equal(calls[0].body.p_request.ai_demo_consent.signed_at, undefined);
});

test("API refuses to acknowledge a demo when an older RPC omits evidence", async (t) => {
  mockBackend(t, { id: "old-rpc-id" });
  const res = await runHandler(valid);
  assert.equal(res.statusCode, 502);
  assert.equal(res.body.error, "AI_DEMO_CONSENT_NOT_SAVED");
});

test("API rejects incomplete AI permission before any database or notification request", async (t) => {
  const calls = mockBackend(t, { id: "unused" });
  const res = await runHandler({ ...valid, phone: "" });
  assert.equal(res.statusCode, 400);
  assert.equal(calls.length, 0);
});
