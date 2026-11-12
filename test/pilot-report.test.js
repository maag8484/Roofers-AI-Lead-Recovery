import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizePilot, renderReport } from '../scripts/pilot-report.mjs';
const pilot = calls => ({ pilot_id:'test',period_start:'2026-11-12T00:00:00Z',period_end:'2026-11-26T00:00:00Z',calls });
const call = { is_test:false,staff_answered:false,provider_call_id:'call-1',evidence_ref:'restricted/provider/1',lead_key:'hashed-1',occurred_at:'2026-11-13T00:00:00Z',handled:true,booking_requested:true };
test('missing outcomes stay unverified, booking requests do not become appointments',()=>{
 const r=summarizePilot(pilot([call])); assert.equal(r.stages.booking_requested.verified_true,1); assert.equal(r.stages.appointment_confirmed.verified_true,0); assert.equal(r.stages.appointment_confirmed.unverified,1);
});
test('tests excluded and duplicate real calls rejected',()=>{
 assert.equal(summarizePilot(pilot([{is_test:true}])).recorded_real_calls,0);
 assert.throws(()=>summarizePilot(pilot([call,call])),/Duplicate/);
});
test('unsupported customer outcome cannot count',()=>{
 assert.throws(()=>summarizePilot(pilot([{...call,inspection_held:true}])),/evidence and verifier/);
});
test('empty evidence is explicitly not a customer result',()=>{
 assert.match(renderReport(summarizePilot(pilot([]))),/No real-call evidence supplied/);
});
test('out-of-period calls rejected',()=>{
 assert.throws(()=>summarizePilot(pilot([{...call,occurred_at:'2026-12-01T00:00:00Z'}])),/outside/);
});
