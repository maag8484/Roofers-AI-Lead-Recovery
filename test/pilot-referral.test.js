import test from 'node:test';
import assert from 'node:assert/strict';
import { referralCode, pilotMetadata, hasPilotRequest, pilotOffer } from '../src/lib/pilot.js';
import { validateAuditRequest } from '../api/audit-request.js';
import { readFileSync } from 'node:fs';
function store() { const items = new Map(); return {getItem:k=>items.get(k),setItem:(k,v)=>items.set(k,v)}; }
test('partner ref persists from landing to audit/signup and latest explicit valid code wins', () => {
  const storage = store();
  assert.equal(referralCode({search:'?ref=PARTNER_DEMO'}, storage), 'PARTNER_DEMO');
  assert.equal(referralCode({search:''}, storage), 'PARTNER_DEMO');
  assert.equal(referralCode({search:'?ref=NEXT-2'}, storage), 'NEXT-2');
  assert.equal(referralCode({search:'?ref=<script>'}, storage), 'NEXT-2');
  const metadata = pilotMetadata(referralCode({search:''}, storage));
  assert.equal(metadata.partner_ref, 'NEXT-2');
  assert.ok(hasPilotRequest({user_metadata:metadata}));
  assert.equal(metadata.pilot_terms_version, 'pilot-14d-40calls-199-v3');
});
test('audit validation persists ref into insert payload; invalid codes dropped', () => {
  const input = {fullName:'Test Roofer', email:'qa@example.com',company:'QA Test',serviceArea:'Test',preferredContact:'Email',contactConsent:true};
  const {payload, errors} = validateAuditRequest({...input, attribution:{ref:'PARTNER_DEMO'}});
  assert.deepEqual(errors, []);
  assert.equal(payload.attribution.ref, 'PARTNER_DEMO');
  assert.equal(validateAuditRequest({...input, attribution:{ref:'<script>'}}).payload.attribution.ref, undefined);
});
test('new pilot entry and continuation cannot invoke legacy auto-converting checkout', () => {
  for (const path of ['src/pages/CheckoutPage.jsx','src/pages/SignupPage.jsx','src/pages/BillingPage.jsx']) {
    assert.doesNotMatch(readFileSync(path,'utf8'), /invokeFunction\("stripe-create-checkout"/);
  }
});
test('disabled storage cannot crash referral capture or lose the current URL code', () => {
 const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
 Object.defineProperty(globalThis, 'localStorage', { configurable:true, get(){throw new Error('storage disabled');} });
 try { assert.equal(referralCode({search:'?ref=PARTNER_DEMO'}), 'PARTNER_DEMO'); assert.equal(referralCode({search:''}), null); }
 finally { if (descriptor) Object.defineProperty(globalThis,'localStorage',descriptor); else delete globalThis.localStorage; }
});

test('new pilots get 14 days; accepted 30-day pilots retain their duration', () => {
  assert.equal(pilotOffer().days, 14);
  const legacy = {user_metadata:{pilot_program:'roof-ai-pilot-01',pilot_terms_version:'pilot-30d-40calls-v1'}};
  assert.equal(pilotOffer(legacy).days, 30);
  assert.equal(legacy.user_metadata.pilot_terms_version, 'pilot-30d-40calls-v1');
  assert.equal(pilotOffer({user_metadata:pilotMetadata(null)}).days, 14);
  assert.equal(pilotOffer({user_metadata:{pilot_program:'roof-ai-pilot-01'}}).days, null);
});

test('accepted founding quotes keep $149; new offers use $199 and unknown quotes are not guessed', () => {
  const previous = version => ({user_metadata:{pilot_program:'roof-ai-pilot-01',pilot_terms_version:version}});
  for (const version of ['pilot-30d-40calls-v1','pilot-14d-40calls-v2']) {
    assert.equal(pilotOffer(previous(version)).foundingRateUsd, 149);
  }
  assert.equal(pilotOffer(previous('pilot-14d-40calls-v2')).days, 14);
  assert.equal(pilotOffer({user_metadata:pilotMetadata(null)}).foundingRateUsd, 199);
  assert.equal(pilotOffer().foundingRateUsd, 199);
  assert.equal(pilotOffer(previous('unknown')).foundingRateUsd, null);
});
