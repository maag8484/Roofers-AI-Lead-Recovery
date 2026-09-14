import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";

const pageHtml = await readFile(new URL("../public/how-much-are-missed-calls-costing-your-roofing-company/index.html", import.meta.url), "utf8");
const siteScript = await readFile(new URL("../public/revenue-recovery-assets/site.js", import.meta.url), "utf8");

const accepted = () => ({ ok: true, status: 201, json: async () => ({ ok: true, requestId: "qa-request" }) });
function createPage(fetchImpl, options = {}) {
  const dom = new JSDOM(pageHtml, {
    runScripts: "outside-only",
    url: options.url || "https://www.roofaileadrecovery.com/how-much-are-missed-calls-costing-your-roofing-company/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=daily_lead_recovery&utm_content=0909_calculator",
  });
  if (options.session) dom.window.sessionStorage.setItem("roof_ai_session_touch", JSON.stringify(options.session));
  if (options.firstTouch) dom.window.localStorage.setItem("roof_ai_first_touch", JSON.stringify(options.firstTouch));
  dom.window.fetch = fetchImpl;
  dom.window.eval(siteScript);
  return dom;
}

function enterCompleteScenario(window) {
  const values = {
    "missed-calls": "24",
    "legitimate-rate": "50",
    "close-rate": "25",
    "job-value": "12000",
  };
  for (const [id, value] of Object.entries(values)) {
    const input = window.document.querySelector(`#${id}`);
    input.value = value;
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
  }
  window.document.querySelector("#job-value").dispatchEvent(new window.Event("change", { bubbles: true }));
}

function openAndFillAudit(window) {
  window.document.querySelector('[data-audit-open]').click();
  const form = window.document.querySelector("[data-audit-form]");
  form.querySelector('[name="fullName"]').value = "Jamie Roofer";
  form.querySelector('[name="email"]').value = "jamie@example.com";
  form.querySelector('[name="company"]').value = "Example Roofing";
  form.querySelector('[name="serviceArea"]').value = "Columbus, OH";
  form.querySelector('[name="contactConsent"]').checked = true;
  return form;
}

const events = (window, name) => window.dataLayer.filter((entry) => entry.event === name);

test("calculator completion is attributed and counted once", () => {
  const dom = createPage(async () => accepted());
  enterCompleteScenario(dom.window);

  const completions = events(dom.window, "calculator_complete");
  assert.equal(completions.length, 1);
  assert.equal(completions[0].traffic_source, "linkedin");
  assert.equal(completions[0].traffic_medium, "organic_social");
  assert.equal(completions[0].traffic_campaign, "daily_lead_recovery");
  assert.equal(completions[0].traffic_content, "0909_calculator");
  assert.equal(completions[0].revenue_risk_band, "10k_50k");

  dom.window.document.querySelector("#job-value").dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  assert.equal(events(dom.window, "calculator_complete").length, 1);
  assert.ok(dom.window.document.querySelector('script[src*="GTM-WKMDN97L"]'));
  dom.window.close();
});

test("audit submission is attributed only after an accepted API response", async () => {
  const dom = createPage(async () => accepted());
  enterCompleteScenario(dom.window);
  const form = openAndFillAudit(dom.window);
  form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));

  const submissions = events(dom.window, "audit_submit");
  assert.equal(submissions.length, 1);
  assert.equal(submissions[0].traffic_source, "linkedin");
  assert.equal(submissions[0].traffic_content, "0909_calculator");
  assert.equal(submissions[0].calculator_included, true);
  assert.equal(events(dom.window, "audit_form_submitted").length, 1);
  const sentToGA4 = dom.window.dataLayer.filter((entry) => entry[0] === "event" && entry[1] === "audit_submit");
  assert.equal(sentToGA4.length, 1);
  assert.equal(sentToGA4[0][2].send_to, "G-8PV83SZ3X0");
  assert.equal(sentToGA4[0][2].traffic_source, "linkedin");
  const submitButton = form.querySelector(".audit-submit");
  assert.equal(submitButton.textContent, "Request received");
  assert.equal(submitButton.disabled, true);
  assert.equal(submitButton.classList.contains("is-success"), true);
  dom.window.close();
});

test("rate-limited audit requests do not create a conversion", async () => {
  const dom = createPage(async () => ({ ok: false, status: 429, json: async () => ({ error: "RATE_LIMITED" }) }));
  const form = openAndFillAudit(dom.window);
  form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(events(dom.window, "audit_submit").length, 0);
  assert.equal(events(dom.window, "audit_form_error").at(-1).error_type, "rate_limited");
  dom.window.close();
});

test("all five calculator audit CTAs target and open the on-page form", () => {
  const dom = createPage(async () => accepted());
  const w = dom.window;
  const links = [...w.document.querySelectorAll("[data-audit-open]")];
  assert.equal(links.length, 5);
  for (const link of links) {
    assert.equal(link.getAttribute("href"), "#audit-request");
    link.click();
    assert.equal(w.document.querySelector("[data-audit-dialog]").hasAttribute("open"), true);
    assert.equal(w.document.activeElement.id, "audit-name");
  }
  assert.equal(w.document.querySelector('a[href^="mailto:"][href*="subject="]'), null);
  assert.equal(events(w, "audit_submit").length, 0);
  dom.window.close();
});

test("unconfirmed 2xx responses never count as a conversion or auto-open email", async () => {
  for (const response of [
    { ok: true, status: 202, json: async () => ({ ok: true }) },
    { ok: true, status: 200, json: async () => ({ ok: true, requestId: "unexpected" }) },
    { ok: true, status: 201, json: async () => ({ ok: false, requestId: "unexpected" }) },
    { ok: true, status: 201, json: async () => ({ ok: true }) },
    { ok: true, status: 200, json: async () => { throw new SyntaxError("HTML response"); } },
  ]) {
    const dom = createPage(async () => response);
    const url = dom.window.location.href;
    const form = openAndFillAudit(dom.window);
    form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(events(dom.window, "audit_submit").length, 0);
    assert.equal(dom.window.location.href, url);
    assert.equal(form.elements.email.value, "jamie@example.com");
    assert.equal(form.querySelector(".audit-submit").disabled, false);
    assert.equal(form.querySelector("[data-audit-email-fallback]").hidden, false);
    dom.window.close();
  }
});

test("response-body timeout releases pending state without a false conversion", async () => {
  const dom = createPage(async () => ({ ok: true, status: 201, json: () => new Promise(() => {}) }));
  const w = dom.window;
  const setTimeout = w.setTimeout.bind(w);
  w.setTimeout = (callback, delay) => setTimeout(callback, delay === 10000 ? 5 : delay);
  const form = openAndFillAudit(w);
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await new Promise((resolve) => globalThis.setTimeout(resolve, 20));
  assert.equal(events(w, "audit_submit").length, 0);
  assert.equal(form.querySelector(".audit-submit").disabled, false);
  assert.match(form.querySelector("[data-audit-status]").textContent, /couldn’t confirm/);
  dom.window.close();
});

test("double submissions send one request and one conversion", async () => {
  let resolveRequest;
  let calls = 0;
  const dom = createPage(() => { calls++; return new Promise((resolve) => { resolveRequest = resolve; }); });
  const w = dom.window;
  const form = openAndFillAudit(w);
  const submit = () => form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  submit(); submit();
  assert.equal(calls, 1);
  resolveRequest(accepted());
  await new Promise((resolve) => setTimeout(resolve, 0));
  submit();
  assert.equal(calls, 1);
  assert.equal(events(w, "audit_submit").length, 1);
  dom.window.close();
});

test("YouTube campaign survives internal navigation and reaches saved audit attribution without PII analytics", async () => {
  let payload;
  const url = "https://www.roofaileadrecovery.com/how-much-are-missed-calls-costing-your-roofing-company/";
  const session = { utm_source: "youtube", utm_medium: "organic_video", utm_campaign: "daily_lead_recovery", utm_content: "20260914_calculator_example" };
  const dom = createPage(async (_url, options) => { payload = JSON.parse(options.body); return accepted(); }, { url, session, firstTouch: { utm_source: "linkedin", utm_content: "older_post" } });
  enterCompleteScenario(dom.window);
  const form = openAndFillAudit(dom.window);
  form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(payload.attribution, session);
  for (const event of [events(dom.window, "calculator_complete")[0], events(dom.window, "audit_submit")[0]]) {
    assert.equal(event.traffic_source, "youtube");
    assert.equal(event.traffic_medium, "organic_video");
    assert.equal(event.traffic_content, session.utm_content);
    for (const pii of ["Jamie Roofer", "jamie@example.com", "Example Roofing", "Columbus, OH"]) assert.equal(JSON.stringify(event).includes(pii), false);
  }
  dom.window.close();
});

test("new tagged visit does not borrow omitted campaign fields from the old source", () => {
  const dom = createPage(async () => accepted(), {
    url: "https://www.roofaileadrecovery.com/how-much-are-missed-calls-costing-your-roofing-company/?utm_source=youtube&utm_medium=organic_video",
    session: { utm_source: "linkedin", utm_content: "old_linkedin_post" },
    firstTouch: { utm_source: "linkedin", utm_content: "old_linkedin_post" },
  });
  enterCompleteScenario(dom.window);
  const event = events(dom.window, "calculator_complete")[0];
  assert.equal(event.traffic_source, "youtube");
  assert.equal(event.traffic_content, "none");
  dom.window.close();
});

test("preview hosts do not load production GA4 or send conversion commands", () => {
  const dom = createPage(async () => accepted(), { url: "https://roof-ai-preview.vercel.app/how-much-are-missed-calls-costing-your-roofing-company/" });
  enterCompleteScenario(dom.window);
  assert.equal(dom.window.document.querySelector('script[src*="gtag/js"]'), null);
  assert.equal(dom.window.dataLayer.filter((entry) => entry[0] === "event").length, 0);
  assert.equal(events(dom.window, "calculator_complete").length, 1);
  dom.window.close();
});
