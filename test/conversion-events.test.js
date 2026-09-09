import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";

const pageHtml = await readFile(new URL("../public/how-much-are-missed-calls-costing-your-roofing-company/index.html", import.meta.url), "utf8");
const siteScript = await readFile(new URL("../public/revenue-recovery-assets/site.js", import.meta.url), "utf8");

function createPage(fetchImpl) {
  const dom = new JSDOM(pageHtml, {
    runScripts: "outside-only",
    url: "https://www.roofaileadrecovery.com/how-much-are-missed-calls-costing-your-roofing-company/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=daily_lead_recovery&utm_content=0909_calculator",
  });
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
  window.document.querySelector('a[href^="mailto:cory@roofaileadrecovery.com"]').click();
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
  const dom = createPage(async () => ({ ok: true, status: 201 }));
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
  const dom = createPage(async () => ({ ok: true, status: 201 }));
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
