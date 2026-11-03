import assert from 'node:assert/strict';
import test from 'node:test';
import {founderContext,ownedSetup} from '../supabase/functions/_shared/founding-card-setup.mjs';
import {termsVersion} from '../supabase/functions/_shared/founding-card-pilot.mjs';
const user={id:'u',email_confirmed_at:'2026-11-03',app_metadata:{roof_founding_offer:{version:termsVersion,status:'reserved',user_id:'u',reservation_id:'r',stripe_customer_id:'cus_123'}}};
test('signup metadata alone cannot authorize a founder card session',()=>{
 assert.throws(()=>founderContext({...user,user_metadata:user.app_metadata,app_metadata:{}}));
 assert.throws(()=>founderContext({...user,id:'other'}));assert.throws(()=>founderContext({...user,email_confirmed_at:null}));
});
test('only a completed setup for this customer and reserved offer can proceed',()=>{
 const ctx=founderContext(user),meta={terms:termsVersion,reservation:'r',user_id:'u'};
 const s={livemode:false,mode:'setup',status:'complete',customer:'cus_123',client_reference_id:'u',metadata:meta,setup_intent:{status:'succeeded',customer:'cus_123',usage:'off_session',metadata:meta,payment_method:'pm_fixture'}};
 assert.ok(ownedSetup(s,ctx,false));assert.ok(!ownedSetup(s,ctx,true));
 for(const patch of [{customer:'cus_other'},{status:'open'},{setup_intent:null},{metadata:{...meta,reservation:'other'}}])assert.ok(!ownedSetup({...s,...patch},ctx,false));
});
