import test from 'node:test';
import assert from 'node:assert/strict';
import {createFounderBillingHandler,createFounderActivationHandler} from '../supabase/functions/_shared/founder-worker-handlers.mjs';
import {termsVersion} from '../supabase/functions/_shared/founding-card-pilot.mjs';
import {consentCopy} from '../supabase/functions/_shared/founding-card-setup.mjs';
const activationTime = Date.parse('2026-11-01T12:00:00Z');
const companyId='11111111-1111-4111-8111-111111111111';
const secret='s'.repeat(40);
function fixture() {
 const f={time:activationTime+336*3600000+1000,creates:[],inserts:0,saveError:false,createError:false};
 f.row={reservation_id:'reservation_1',user_id:'user1',company_id:companyId,customer_id:'cus_test1',setup_session_id:'cs_test_123',live_test_receipt:'provider_receipt_1',activated_at:new Date(activationTime).toISOString(),consent_version:termsVersion,canceled_at:null,claimed_at:null,stripe_subscription_id:null};
 f.company={id:companyId,user_id:'user1',is_live:true,details_submitted:true};
 f.user={id:'user1',email:'fixture@example.invalid',email_confirmed_at:'2026-10-31T12:00:00Z',app_metadata:{roof_founding_offer:{version:termsVersion,status:'reserved',user_id:'user1',reservation_id:'reservation_1',stripe_customer_id:'cus_test1'}}};
 const m={reservation:'reservation_1',terms:termsVersion,user_id:'user1',consent_request:'11111111-1111-4111-8111-111111111111',consent_text:consentCopy};
 f.session={id:'cs_test_123',created:activationTime/1000-60,livemode:false,mode:'setup',status:'complete',customer:'cus_test1',client_reference_id:'user1',metadata:{...m},setup_intent:{status:'succeeded',customer:'cus_test1',usage:'off_session',payment_method:'pm_1',metadata:{...m}}};
 f.customer={id:'cus_test1',livemode:false,email:f.user.email,address:{country:'US',postal_code:'45402'},metadata:{supabase_user_id:'user1'}};
 f.pm={id:'pm_1',customer:'cus_test1',livemode:false};
 f.plan={active:true,livemode:false,currency:'usd',unit_amount:29900,recurring:{interval:'month',interval_count:1},product:'prod_1'};
 f.discount={active:true,livemode:false,restrictions:{first_time_transaction:true},coupon:{valid:true,livemode:false,currency:'usd',amount_off:10000,duration:'repeating',duration_in_months:12,max_redemptions:10,times_redeemed:0,applies_to:{products:['prod_1']}}};
 f.db={auth:{admin:{getUserById:async()=>({data:{user:f.user}})}},from(table){
  let update;
  const q={select(){return q;},eq(){return q;},update(value){update=value;return q;},async single(){
    if(update){if(f.saveError)return {error:{message:'failed'}};Object.assign(f.row,update);return {data:{reservation_id:f.row.reservation_id}};}
    return {data:table==='roofing_companies'?structuredClone(f.company):structuredClone(f.row)};
  },async maybeSingle(){return {data:structuredClone(f.row)};},async insert(value){
    if(f.row)return {error:{code:'23505'}}; f.row={...value,canceled_at:null,claimed_at:null,stripe_subscription_id:null};f.inserts++;return {error:null};
  }};return q;
 },async rpc(){
   if(f.beforeClaim)f.beforeClaim();
   if(!f.row||f.row.canceled_at||f.row.claimed_at||f.row.stripe_subscription_id||f.time<activationTime+336*3600000||f.time>=activationTime+337*3600000)return {data:[]};
   f.row.claimed_at=new Date(f.time).toISOString();return {data:[structuredClone(f.row)]};
 }};
 f.stripe={checkout:{sessions:{retrieve:async()=>f.session}},paymentMethods:{retrieve:async()=>f.pm},customers:{retrieve:async()=>f.customer},prices:{retrieve:async()=>f.plan},promotionCodes:{retrieve:async()=>f.discount},subscriptions:{list:async()=>({data:f.prior??[]}),create:async(params,options)=>{
   f.creates.push({params,options});if(f.createError)throw Error('Network timeout after acceptance');return {id:'sub_1',customer:'cus_test1',livemode:false,status:'active'};
 }}};
 f.env=name=>({ROOF_FOUNDER_WORKER_SECRET:secret,ROOF_FOUNDER_ACTIVATION_SECRET:secret,ROOF_FOUNDER_BILLING_READY:'true',ROOF_FOUNDER_ACTIVATION_READY:'true',ROOF_TEST_MONTHLY_PRICE:'price_test',ROOF_TEST_FOUNDING_PROMO:'promo_test'})[name];
 f.dependencies={db:f.db,stripe:f.stripe,live:false,env:f.env,now:()=>f.time};
 f.billing=createFounderBillingHandler(f.dependencies);f.activate=createFounderActivationHandler(f.dependencies);
 return f;
}
function request(body,key=secret){return new Request('https://example.invalid',{method:'POST',headers:{authorization:`Bearer ${key}`,'content-type':'application/json'},body:JSON.stringify(body)});}
const bill=f=>f.billing(request({reservation_id:'reservation_1'}));
const activationBody={company_id:companyId,setup_session:'cs_test_123',receipt:'provider_receipt_1',live_test_at:new Date(activationTime).toISOString()};
test('actual billing handler creates one discounted automatic subscription and replay never charges again',async()=>{
 const f=fixture();assert.equal((await bill(f)).status,200);assert.equal(f.creates.length,1);assert.equal(f.row.stripe_subscription_id,'sub_1');
 assert.deepEqual(f.creates[0].params.discounts,[{promotion_code:'promo_test'}]);assert.equal(f.creates[0].params.payment_behavior,'error_if_incomplete');
 assert.equal(f.creates[0].options.idempotencyKey,'roof-founder-first-paid:reservation_1');assert.equal((await (await bill(f)).json()).status,'already_billed');assert.equal(f.creates.length,1);
});
test('two simultaneous actual handler requests acquire only one charge claim',async()=>{const f=fixture();await Promise.all([bill(f),bill(f)]);assert.equal(f.creates.length,1);});
test('cancellation winning the atomic claim race prevents billing',async()=>{const f=fixture();f.beforeClaim=()=>{f.row.canceled_at=new Date(f.time).toISOString();};assert.equal((await bill(f)).status,409);assert.equal(f.creates.length,0);});
test('already canceled activation remains canceled and no Stripe create occurs',async()=>{const f=fixture();f.row.canceled_at='2026-11-13T12:00:00Z';assert.equal((await (await bill(f)).json()).status,'canceled');assert.equal(f.creates.length,0);});
test('ambiguous Stripe failure leaves a claim that blocks automatic retries',async()=>{const f=fixture();f.createError=true;assert.equal((await bill(f)).status,503);assert.ok(f.row.claimed_at);assert.equal((await bill(f)).status,409);assert.equal(f.creates.length,1);});
test('database save failure after Stripe acceptance cannot cause a second charge',async()=>{const f=fixture();f.saveError=true;assert.equal((await bill(f)).status,503);assert.equal((await bill(f)).status,409);assert.equal(f.creates.length,1);});
test('before day 14 is not due and missed one-hour window requires manual review',async()=>{const f=fixture();f.time=activationTime+336*3600000-1;assert.equal((await (await bill(f)).json()).status,'not_due');f.time=activationTime+337*3600000;assert.equal((await (await bill(f)).json()).error,'manual_review_overdue');assert.equal(f.creates.length,0);});
for(const [name,alter] of Object.entries({
 'old offer':f=>{f.user.app_metadata.roof_founding_offer.version='pilot-v1';},
 'missing exact consent':f=>{delete f.session.metadata.consent_text;},
 'mismatched consent intent':f=>{f.session.setup_intent.metadata.consent_request='different';},
 'customer mismatch':f=>{f.customer.metadata.supabase_user_id='other';},
 'missing billing address':f=>{delete f.customer.address;},
 'saved payment belongs elsewhere':f=>{f.pm.customer='cus_other';},
 'old subscriber':f=>{f.prior=[{id:'sub_old'}];},
 'coupon expired allocation':f=>{f.discount.coupon.times_redeemed=10;},
 'coupon duration changed':f=>{f.discount.coupon.duration='forever';},
 'wrong product':f=>{f.plan.product='prod_other';}
}))test(`${name} never crosses charge boundary`,async()=>{const f=fixture();alter(f);assert.equal((await bill(f)).status,409);assert.equal(f.creates.length,0);assert.equal(f.row.claimed_at,null);});
test('worker authentication and disabled gate fail before database access',async()=>{const f=fixture();assert.equal((await f.billing(request({reservation_id:'reservation_1'},'wrong'))).status,403);const handler=createFounderBillingHandler({...f.dependencies,env:n=>n==='ROOF_FOUNDER_BILLING_READY'?'false':f.env(n)});assert.equal((await handler(request({reservation_id:'reservation_1'}))).status,503);assert.equal(f.creates.length,0);});
test('activation records actual verified test once, returns same date on late retry, and never reopens cancellation',async()=>{
 const f=fixture();f.row=null;f.time=activationTime+1000;const result=await f.activate(request(activationBody));assert.equal(result.status,200);assert.equal(f.inserts,1);assert.equal((await result.json()).first_charge_at,'2026-11-15T12:00:00.000Z');
 f.time+=3600000;f.row.canceled_at=new Date(f.time).toISOString();const replay=await f.activate(request(activationBody));assert.equal(replay.status,200);assert.equal((await replay.json()).status,'canceled');assert.equal(f.inserts,1);
});
test('activation cannot be rewritten with a later test to reset trial',async()=>{const f=fixture();f.time=activationTime+1000;const result=await f.activate(request({...activationBody,live_test_at:new Date(activationTime+500).toISOString()}));assert.equal(result.status,409);assert.equal(f.row.activated_at,new Date(activationTime).toISOString());});
test('fresh activation rejects stale tests, unfinished setup and mismatched consent',async()=>{
 for(const alter of [f=>{f.time=activationTime+300001;},f=>{f.company.is_live=false;},f=>{f.session.setup_intent.metadata.consent_text='older terms';}]){const f=fixture();f.row=null;f.time=activationTime+1000;alter(f);assert.notEqual((await f.activate(request(activationBody))).status,200);assert.equal(f.inserts,0);}
});
