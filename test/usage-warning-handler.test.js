import test from 'node:test';
import assert from 'node:assert/strict';
import {createUsageWarningHandler} from '../supabase/functions/_shared/dispatch-usage-warning.mjs';
import {termsVersion} from '../supabase/functions/_shared/founding-card-pilot.mjs';
const id='00000000-0000-4000-8000-000000000001', stamp=1800000000, token='fixture-worker-secret-32-characters';
function fixture() {
  const f={state:'pending',messages:[],packs:0,used:65,providerStatus:202,providerReceipt:'provider_fixture',finishError:false,resolveCount:0};
  f.sub={id:'sub_1',latest_invoice:'in_1',livemode:true,status:'active',cancel_at_period_end:false,current_period_start:stamp-1000,current_period_end:stamp+1000,
    metadata:{supabase_user_id:'user_1',pilot_terms_version:termsVersion},customer:{livemode:true,id:'cus_1',email:'owner@example.invalid',metadata:{supabase_user_id:'user_1'}}};
  f.invoice={id:'in_1',livemode:true,status:'paid',paid:true,subscription:'sub_1',customer:'cus_1',currency:'usd',amount_paid:19900,payment_intent:{livemode:true,status:'succeeded',customer:'cus_1',currency:'usd',amount_received:19900,latest_charge:{livemode:true,paid:true,captured:true,disputed:false,amount_refunded:0}}};
  f.user={email_confirmed_at:'2026-01-01',email:'owner@example.invalid'};
  const db={auth:{admin:{getUserById:async()=>({data:{user:f.user}})}},from(table){
    let update, expected;
    const q={select(){return q;},eq(k,v){if(k==='delivery_state')expected=v;return q;},limit(){return q;},update(v){update=v;return q;},
      async single(){return q.result();},async maybeSingle(){return q.result();},then(resolve,reject){return q.result().then(resolve,reject);},
      async result(){
        if(table==='roof_paid_periods'){f.resolveCount++;if(f.packAfterClaim && f.state==='claimed')f.packs=1;return {data:{company_id:'company_1',subscription_id:'sub_1',starts_at:new Date((stamp-1000)*1000).toISOString(),ends_at:new Date((stamp+1000)*1000).toISOString()}};}
        if(table==='roofing_companies')return {data:{user_id:'user_1'}};
        if(table==='roof_available_packs')return {count:f.packs};
        if(table==='roof_recovered_call_receipts')return {data:Array.from({length:f.used},(_,n)=>({provider_event_id:'evt_'+n,occurred_at:new Date((stamp-100+n)*1000).toISOString()}))};
        if(table==='roof_usage_warning_outbox'){
          if(expected!==f.state)return {data:null};
          if(f.finishError && update.delivery_state==='sent')return {error:Error('persist failure')};
          Object.assign(f,{state:update.delivery_state,receipt:update.provider_receipt});return {data:{period_id:id}};
        }
        throw Error('Unexpected table');
      }};return q;
  }};
  f.config={stripe:{invoices:{retrieve:async()=>f.invoice},subscriptions:{retrieve:async()=>f.sub}},mode:'live',db,token,sendgridKey:'fixture-only',ready:true,now:()=>stamp*1000,
    fetcher:async(url,opts)=>{f.messages.push({url,body:JSON.parse(opts.body)});if(f.timeout)throw Error('Accepted but timeout');return new Response(null,{status:f.providerStatus,headers:f.providerReceipt?{'x-message-id':f.providerReceipt}:{}});}};
  f.run=(input={period_id:id},opts={},auth=token)=>createUsageWarningHandler({...f.config,...opts})(new Request('https://fixture.invalid',{method:'POST',headers:{authorization:'Bearer '+auth},body:JSON.stringify(input)}));
  return f;
}
test('real warning handler sends one owner-only text message and records provider acceptance',async()=>{
  const f=fixture();assert.equal((await f.run()).status,200);assert.equal(f.state,'sent');assert.equal(f.receipt,'provider_fixture');
  const mail=f.messages[0].body;assert.deepEqual(mail.personalizations[0].to,[{email:'owner@example.invalid'}]);assert.equal(mail.from.email,'cory@roofaileadrecovery.com');assert.equal(mail.reply_to.email,mail.from.email);assert.equal(mail.content[0].type,'text/plain');assert.match(mail.content[0].value,/65 of your 75/);
  assert.equal((await f.run()).status,200);assert.equal(f.messages.length,1);
});
test('concurrent HTTP requests share atomic outbox claim',async()=>{
  const f=fixture();await Promise.all([f.run(),f.run(),f.run()]);assert.equal(f.messages.length,1);assert.equal(f.state,'sent');
});
test('provider rejection, timeout, missing receipt and finish failure hold claim without repeat email',async()=>{
  for(const change of [f=>f.providerStatus=500,f=>f.timeout=true,f=>f.providerReceipt=null,f=>f.finishError=true]){
    const f=fixture();change(f);assert.equal((await f.run()).status,503);assert.equal(f.state,'claimed');await f.run();assert.equal(f.messages.length,1);
  }
});
test('pack purchased after claim suppresses warning',async()=>{
  const f=fixture();f.packAfterClaim=true;assert.equal((await f.run()).status,200);assert.equal(f.state,'suppressed');assert.equal(f.messages.length,0);
});
test('warnings reject unavailable/auth failures and malformed periods',async()=>{
  const f=fixture();assert.equal((await f.run(undefined,{},'wrong')).status,403);assert.equal((await f.run(undefined,{token:'short'},'short')).status,403);
  assert.equal((await f.run(undefined,{ready:false})).status,503);assert.equal((await f.run({period_id:'bad'})).status,400);assert.equal((await f.run(null)).status,400);assert.equal(f.messages.length,0);
});
test('legacy, mismatched owner, canceled, under-limit, exhausted and pack-covered accounts never send',async()=>{
  for(const change of [f=>f.sub.metadata.pilot_terms_version='pilot-v1',f=>f.sub.customer.metadata.supabase_user_id='other',f=>f.user.email='other@example.invalid',f=>f.sub.cancel_at_period_end=true,f=>f.used=64,f=>f.used=75,f=>f.packs=1]){
    const f=fixture();change(f);assert.equal((await f.run()).status,200);assert.equal(f.messages.length,0);assert.equal(f.state,'pending');
  }
});

test('base-plan refund or dispute after paid period was recorded prevents warning email',async()=>{
  for(const change of [f=>f.invoice.payment_intent.latest_charge.amount_refunded=19900,f=>f.invoice.payment_intent.latest_charge.disputed=true,f=>f.invoice.paid=false,f=>f.invoice.payment_intent.status='requires_payment_method',f=>f.invoice.subscription='sub_other']){
    const f=fixture();change(f);assert.equal((await f.run()).status,200);assert.equal(f.messages.length,0);assert.equal(f.state,'pending');
  }
});
