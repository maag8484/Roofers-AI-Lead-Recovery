import test from 'node:test';
import assert from 'node:assert/strict';
import { foundingMonthQuote } from '../supabase/functions/_shared/founding-card-pilot.mjs';
test('founding plan quotes whole packs without treating extra usage as a purchase', () => {
  for (const [packs,limit,total] of [[0,75,19900],[1,95,24900],[2,115,29900]]) {
    const q = foundingMonthQuote(packs);
    assert.deepEqual([q.callLimit,q.subtotalCents],[limit,total]);
  }
  for (const bad of [-1,0.5,'1',NaN,Number.MAX_SAFE_INTEGER]) assert.throws(()=>foundingMonthQuote(bad));
});
test('50-call pack alone and combined with a 20-call pack', () => {
  for (const [small, large, limit, subtotal] of [[0,1,125,29900],[1,1,145,34900]]) {
    const q = foundingMonthQuote(small,large);
    assert.deepEqual([q.callLimit,q.subtotalCents],[limit,subtotal]);
  }
  assert.throws(()=>foundingMonthQuote(0,-1));
  assert.throws(()=>foundingMonthQuote(1,Number.MAX_SAFE_INTEGER));
});

test('first charge never precedes 14 full days, including subsecond activations', async () => {
  const {foundingTrialEnd,termsVersion}=await import('../supabase/functions/_shared/founding-card-pilot.mjs');
  const record={version:termsVersion,consentAt:'2026-11-03T16:00:00Z',liveTestAt:'2026-11-04T16:00:00.931Z',cardSetupVerified:true,setupComplete:true,founderReserved:true,paidAllowanceQuoted:true,cancelled:false};
  const at=Date.parse(record.liveTestAt);
  assert.equal(foundingTrialEnd(record,at),Math.ceil(at/1000)+14*86400);
  assert.throws(()=>foundingTrialEnd({...record,cancelled:true},at));
});
