import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const shared = await readFile(new URL('../public/revenue-recovery-assets/site.js', import.meta.url), 'utf8');
const growth = await readFile(new URL('../public/revenue-recovery-assets/growth.js', import.meta.url), 'utf8');
async function page(path) {
  const html = await readFile(new URL(`../public/${path}/index.html`, import.meta.url), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: `https://www.roofaileadrecovery.com/${path}/?utm_source=example_agency&utm_medium=partner_referral&utm_campaign=agency_resource_kit&utm_content=scorecard_20260915` });
  dom.window.eval(shared);
  dom.window.eval(growth);
  return dom;
}

test('sample scorecard does not manufacture calculator or audit conversions', async () => {
  const dom = await page('resources/roofing-missed-call-scorecard');
  assert.equal(dom.window.dataLayer.filter(e => ['calculator_complete', 'audit_submit'].includes(e.event)).length, 0);
  assert.match(dom.window.document.body.textContent, /Sample only — hypothetical numbers/);
  dom.window.close();
});

test('agency link preserves distinct referral attribution and rejects an invalid identifier', async () => {
  const dom = await page('partners/roofing-marketing-agencies');
  const form = dom.window.document.querySelector('[data-partner-link-form]');
  form.elements.partner.value = 'client@example.com';
  form.dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
  assert.equal(dom.window.document.querySelector('[data-partner-link-result] a'), null);
  form.elements.partner.value = 'example_agency';
  form.dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
  const url = new URL(dom.window.document.querySelector('[data-partner-link-result] a').href);
  assert.equal(url.pathname, '/how-much-are-missed-calls-costing-your-roofing-company/');
  assert.equal(url.searchParams.get('utm_source'), 'example_agency');
  assert.equal(url.searchParams.get('utm_medium'), 'partner_referral');
  assert.equal(url.searchParams.get('utm_campaign'), 'agency_resource_kit');
  dom.window.close();
});

test('cohort intent uses the existing audit flow without overriding notes or auto-consenting', async () => {
  const dom = await page('founding-roofing-companies');
  const { document } = dom.window;
  const trigger = document.querySelector('[data-audit-intent]');
  trigger.click();
  const form = document.querySelector('[data-audit-form]');
  assert.match(form.elements.currentProcess.value, /founding-company evaluation/);
  for (const name of ['contactConsent', 'marketingConsent', 'aiDemoRequested']) assert.equal(form.elements[name].checked, false);
  form.elements.currentProcess.value = 'Please review our existing office workflow.';
  trigger.click();
  assert.equal(form.elements.currentProcess.value, 'Please review our existing office workflow.');
  let payload;
  dom.window.fetch = async (_url, options) => { payload = JSON.parse(options.body); return { ok:true, status:201, json:async()=>({ok:true, requestId:'qa-cohort'}) }; };
  for (const [name, value] of Object.entries({fullName:'Internal QA', email:'qa@example.com', company:'Test Roofing', serviceArea:'Example City'})) form.elements[name].value = value;
  form.elements.contactConsent.checked = true;
  form.dispatchEvent(new dom.window.Event('submit', {bubbles:true, cancelable:true}));
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(payload.currentProcess, 'Please review our existing office workflow.');
  assert.equal(payload.attribution.utm_source, 'example_agency');
  const event = dom.window.dataLayer.find(e=>e.event==='audit_submit');
  assert.equal(event.traffic_medium, 'partner_referral');
  dom.window.close();
});
