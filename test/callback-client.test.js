import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { HUMAN_CALLBACK_CONSENT_TEXT } from "../api/audit-request.js";

const script = await readFile(new URL("../public/callback-client.js", import.meta.url), "utf8");
const html = await readFile(new URL("../public/resources/roofing-missed-call-text-back/index.html", import.meta.url), "utf8");
const fields = { fullName: "Test Visitor", email: "private@example.com", phone: "614-555-0123", contactConsent: "on" };
function page(url = "https://www.roofaileadrecovery.com/resources/roofing-missed-call-text-back/?utm_source=jesse&utm_medium=phone&utm_campaign=callback_walkthrough&email=private@example.com", fetcher, stored) {
  const dom = new JSDOM(html, { url, runScripts: "outside-only" });
  const w = dom.window;
  w.gtag = (...args) => (w.events ||= []).push(args);
  w.fetch = fetcher || (async () => ({ status: 201, json: async () => ({ ok: true, requestId: "request-1" }) }));
  if (stored) w.sessionStorage.setItem("roof_ai_session_touch", JSON.stringify(stored));
  w.eval(script);
  return dom;
}
const settle = () => new Promise(resolve => setTimeout(resolve, 10));

test("focused form saves contact-only request once and emits one PII-free confirmed conversion", async () => {
  const calls = [];
  const dom = page(undefined, async (url, options) => {
    calls.push(JSON.parse(options.body));
    return { status: 201, json: async () => ({ ok: true, requestId: "request-1" }) };
  });
  const w = dom.window;
  const form = w.document.querySelector("[data-callback-static]");
  assert.equal(form.elements.address, undefined);
  assert.ok(form.textContent.includes(HUMAN_CALLBACK_CONSENT_TEXT));
  for (const [key, value] of Object.entries(fields)) {
    if (key === "contactConsent") form.elements[key].checked = true;
    else form.elements[key].value = value;
  }
  form.elements.fullName.focus(); form.elements.email.focus();
  assert.equal(w.events.filter(e => e[1] === "callback_form_started").length, 1);
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await settle();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].contactConsent, true);
  assert.equal(calls[0].aiDemoRequested, false);
  assert.equal(calls[0].marketingConsent, false);
  assert.equal(calls[0].attribution.utm_source, "jesse");
  assert.equal(calls[0].submissionPage.includes("email="), false);
  assert.equal(w.events.filter(e => e[1] === "callback_inquiry_submit").length, 1);
  assert.equal(JSON.stringify(w.events).includes("private@example.com"), false);
  assert.equal(w.sessionStorage.getItem("roof_ai_session_touch").includes("private@example.com"), false);
  assert.match(form.querySelector('[role="status"]').textContent, /request is saved/);
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await settle(); assert.equal(calls.length, 1);
  dom.window.close();
});

test("unconfirmed saves and honeypot acknowledgments never count; fields remain for retry", async () => {
  for (const response of [{ status: 202, ok: true }, { status: 201, ok: true }, { status: 429, ok: false }]) {
    const dom = page(undefined, async () => ({ status: response.status, json: async () => response }));
    await assert.rejects(dom.window.roofCallback.submit(fields));
    assert.equal(dom.window.events.some(e => e[1] === "callback_inquiry_submit"), false);
    assert.equal(dom.window.events.filter(e => e[1] === "callback_form_error").length, 1);
    dom.window.close();
  }
});

test("campaign survives guide-to-home navigation and a new tagged visit replaces old campaign", async () => {
  const stored = { utm_source: "jesse", utm_campaign: "callback_walkthrough", landing_page: "/resources/roofing-missed-call-text-back/?email=private@example.com", referrer: "https://example.org/page?email=private@example.com" };
  const dom = page("https://www.roofaileadrecovery.com/", undefined, stored);
  await dom.window.roofCallback.submit(fields);
  const event = dom.window.events.find(e => e[1] === "callback_inquiry_submit");
  assert.equal(event[2].traffic_source, "jesse");
  assert.equal(dom.window.sessionStorage.getItem("roof_ai_session_touch").includes("private@example.com"), false);
  dom.window.close();
  const next = page("https://www.roofaileadrecovery.com/?utm_source=google", undefined, stored);
  await next.window.roofCallback.submit(fields);
  assert.equal(next.window.events[0][2].traffic_source, "google");
  assert.equal(next.window.events[0][2].traffic_campaign, "none");
  next.window.close();
});

test("preview, internal QA and private pages never emit callback analytics", async () => {
  for (const url of ["https://preview.vercel.app/", "https://www.roofaileadrecovery.com/?qa=1", "https://www.roofaileadrecovery.com/?utm_source=qa_internal", "https://www.roofaileadrecovery.com/dashboard"]) {
    const dom = page(url);
    await dom.window.roofCallback.submit(fields);
    assert.equal(dom.window.events, undefined);
    dom.window.close();
  }
});

test("analytics failures cannot report a saved callback as failed", async () => {
  const dom = page();
  dom.window.gtag = () => { throw new Error("Analytics blocked"); };
  assert.equal((await dom.window.roofCallback.submit(fields)).requestId, "request-1");
  dom.window.close();
});
