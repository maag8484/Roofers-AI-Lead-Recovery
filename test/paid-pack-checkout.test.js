import test from 'node:test';
import assert from 'node:assert/strict';
import {createPackCheckoutHandler} from '../supabase/functions/_shared/paid-pack-checkout.mjs';
import {termsVersion} from '../supabase/functions/_shared/founding-card-pilot.mjs';
const stamp = 1800000000;
const requestId = '00000000-0000-4000-8000-000000000003';
const body = {calls: 20, request_id: requestId, requested_at: stamp};
function fixture() {
  const f = {now: stamp, writes: [], sessions: new Map(), failOnce: false};
  f.user = {id: 'user_1', email: 'roof@example.invalid', email_confirmed_at: '2026-01-01'};
  f.period = {id: 'period_1', subscription_id: 'sub_1', starts_at: new Date((stamp-1000)*1000).toISOString(), ends_at: new Date((stamp+10000)*1000).toISOString()};
  f.sub = {id:'sub_1',latest_invoice:'in_1',livemode: true, status: 'active', metadata: {supabase_user_id: f.user.id, pilot_terms_version: termsVersion}, current_period_start: stamp-1000, current_period_end: stamp+10000,
    customer: {id: 'cus_1', livemode: true, metadata: {supabase_user_id: f.user.id}, email: f.user.email}};
  f.invoice = {id:'in_1',livemode:true,status:'paid',paid:true,subscription:'sub_1',customer:'cus_1',currency:'usd',amount_paid:19900,payment_intent:{livemode:true,status:'succeeded',customer:'cus_1',currency:'usd',amount_received:19900,latest_charge:{livemode:true,paid:true,captured:true,disputed:false,amount_refunded:0}}};
  f.price = {active: true, livemode: true, type: 'one_time', currency: 'usd', unit_amount: 5000};
  const db = {from(table) { const q = {select(){return q;}, eq(){return q;}, lte(){return q;}, gt(){return q;}, async single(){return {data: table==='roofing_companies'?{id:'company_1'}:f.period};}}; return q; }};
  f.stripe = {invoices:{retrieve:async()=>f.invoice},subscriptions:{retrieve: async()=>f.sub}, prices:{retrieve: async()=>f.price}, checkout:{sessions:{create: async(args,opts)=>{
    f.writes.push({args,opts});
    const previous=f.sessions.get(opts.idempotencyKey);
    if(previous) assert.deepEqual(args, previous);
    else f.sessions.set(opts.idempotencyKey,args);
    if(f.failOnce){f.failOnce=false;throw Error('Network lost after acceptance');}
    return {url:'https://checkout.stripe.com/c/pay/cs_fixture'};
  }}}};
  f.config = {getUser:async()=>({user:f.user}), db, stripe:f.stripe, mode:'live', ready:true,
    now:()=>f.now*1000, json:(b,status=200)=>Response.json(b,{status}), handleOptions:()=>null};
  f.run = (input=body, opts={})=>createPackCheckoutHandler({...f.config,...opts})(new Request('https://fixture.invalid',{method:'POST',body:JSON.stringify(input)}));
  return f;
}
test('actual checkout handler verifies ownership and creates only explicit selected pack',async()=>{
  const f=fixture(); assert.equal((await f.run()).status,200);
  const {args,opts}=f.writes[0]; assert.equal(args.customer,'cus_1');assert.equal(args.line_items[0].price,'price_1UXn65CB5wADtZS19CXdROLL');
  assert.equal(args.metadata.period_id,'period_1');assert.deepEqual(args.payment_method_types,['card']);assert.equal(args.expires_at,stamp+3600);
  assert.equal(opts.idempotencyKey,`roof-pack:user_1:period_1:20:${requestId}`);
});
test('uncertain checkout retry reuses same Stripe key and exact parameters',async()=>{
  const f=fixture();f.failOnce=true;assert.equal((await f.run()).status,503);f.now+=50;assert.equal((await f.run()).status,200);
  assert.equal(f.sessions.size,1);assert.deepEqual(f.writes[0],f.writes[1]);
});
test('pack gate, missing identity, malformed request and stale request never create checkout',async()=>{
  const f=fixture();assert.equal((await f.run(body,{ready:false})).status,503);
  assert.equal((await f.run(body,{getUser:async()=>({user:null})})).status,401);
  for(const input of [null,{calls:20},{...body,calls:21},{...body,requested_at:stamp-601},{...body,request_id:'bad'}]) assert.equal((await f.run(input)).status,400);
  assert.equal(f.writes.length,0);
});
test('wrong owner, unconfirmed email, ended or mismatched period, legacy terms are excluded',async()=>{
  for(const change of [f=>f.sub.metadata.supabase_user_id='other',f=>f.sub.customer.metadata.supabase_user_id='other',f=>f.sub.customer.email='other@example.invalid',f=>f.user.email_confirmed_at=null,f=>f.sub.current_period_end++,f=>f.sub.metadata.pilot_terms_version='pilot-v1',f=>f.sub.status='past_due',f=>{f.period.ends_at=new Date((stamp+1800)*1000).toISOString();f.sub.current_period_end=stamp+1800;}]){
    const f=fixture();change(f);assert.equal((await f.run()).status,409);assert.equal(f.writes.length,0);
  }
});
test('inactive, recurring, wrong amount or test-mode prices never reach checkout',async()=>{
  for(const change of [p=>p.active=false,p=>p.type='recurring',p=>p.unit_amount=1,p=>p.livemode=false,p=>p.currency='eur']){
    const f=fixture();change(f.price);assert.equal((await f.run()).status,503);assert.equal(f.writes.length,0);
  }
});
test('50-call purchase uses pinned $100 one-time price and a separate explicit request',async()=>{
  const f=fixture();f.price.unit_amount=10000;assert.equal((await f.run({...body,calls:50})).status,200);
  assert.equal(f.writes[0].args.line_items[0].price,'price_1UXn66CB5wADtZS12VbDpqYh');
});

test('later base-plan refund, dispute or unsettled invoice blocks new pack checkout despite recorded period',async()=>{
  for(const change of [f=>f.invoice.payment_intent.latest_charge.amount_refunded=100,f=>f.invoice.payment_intent.latest_charge.disputed=true,f=>f.invoice.status='open',f=>f.invoice.amount_paid=0,f=>f.invoice.subscription='sub_other',f=>f.invoice.customer='cus_other',f=>f.invoice.payment_intent.latest_charge.captured=false]){
    const f=fixture();change(f);assert.equal((await f.run()).status,409);assert.equal(f.writes.length,0);assert.ok(f.period);
  }
});
