import test from 'node:test';
import assert from 'node:assert/strict';
import {dispatchWarning} from '../supabase/functions/_shared/dispatch-usage-warning.mjs';
const fake=()=>{let state='pending',sent=0;return {get sent(){return sent;},get state(){return state;},
 resolve:async()=>({to:'fixture@example.invalid'}),claim:async()=>state==='pending' && !!(state='claimed'),
 send:async()=>{sent++;return 'mock_receipt';},finish:async(_,s)=>{state=s;}};};
test('concurrent deliveries claim one send',async()=>{const f=fake();await Promise.all([dispatchWarning('p',f),dispatchWarning('p',f)]);assert.equal(f.sent,1);assert.equal(f.state,'sent');});
test('missing acceptance receipt holds claim; no retry',async()=>{const f=fake();f.send=async()=>null;await assert.rejects(dispatchWarning('p',f));assert.equal(f.state,'claimed');assert.equal(await dispatchWarning('p',f),'already_handled');});
test('purchased pack between eligibility check and send suppresses email',async()=>{const f=fake();let n=0;f.resolve=async()=>++n===1?{}:null;assert.equal(await dispatchWarning('p',f),'suppressed');assert.equal(f.sent,0);});
