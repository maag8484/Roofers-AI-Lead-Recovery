import test from 'node:test';
import assert from 'node:assert/strict';
import {recordPaidPeriod} from '../supabase/functions/_shared/paid-period.mjs';
import {termsVersion} from '../supabase/functions/_shared/founding-card-pilot.mjs';
function fixture(){
 const f={time:Date.parse('2026-11-15T12:01:00Z'),periods:new Map(),writes:0};
 f.invoice={id:'in_1',livemode:true,status:'paid',paid:true,subscription:'sub_1',customer:'cus_1',amount_paid:19900,
  payment_intent:{id:'pi_1',livemode:true,status:'succeeded',customer:'cus_1',currency:'usd',amount_received:19900,
   latest_charge:{id:'ch_1',paid:true,captured:true,disputed:false,amount_refunded:0}}};
 f.sub={id:'sub_1',livemode:true,status:'active',customer:'cus_1',latest_invoice:'in_1',current_period_start:Date.parse('2026-11-15T12:00:00Z')/1000,current_period_end:Date.parse('2026-12-15T12:00:00Z')/1000,
  metadata:{pilot_terms_version:termsVersion,reservation:'reservation_1',supabase_user_id:'user_1'}};
 f.activation={company_id:'company_1',user_id:'user_1',customer_id:'cus_1',claimed_at:'2026-11-15T12:00:00Z',consent_version:termsVersion,canceled_at:null,stripe_subscription_id:'sub_1'};
 f.company={user_id:'user_1'};
 f.stripe={invoices:{retrieve:async()=>f.invoice},subscriptions:{retrieve:async()=>f.sub}};
 f.db={from(table){return {select(){return this;},eq(){return this;},async single(){return {data:table==='roof_founder_activations'?f.activation:f.company};},async upsert(value,options){
  assert.equal(table,'roof_paid_periods');assert.deepEqual(options,{onConflict:'subscription_id,starts_at',ignoreDuplicates:true});f.writes++;const key=`${value.subscription_id}:${value.starts_at}`;if(!f.periods.has(key))f.periods.set(key,value);return {error:null};
 }}}};
 f.run=()=>recordPaidPeriod('in_1',{stripe:f.stripe,db:f.db,now:()=>f.time});return f;
}
test('settled current founding invoice records exact paid period; replay retains one period',async()=>{const f=fixture();assert.equal(await f.run(),'recorded');assert.equal(await f.run(),'recorded');assert.equal(f.periods.size,1);assert.deepEqual([...f.periods.values()][0],{company_id:'company_1',subscription_id:'sub_1',starts_at:'2026-11-15T12:00:00.000Z',ends_at:'2026-12-15T12:00:00.000Z'});});
for(const [name,alter,expected] of [
 ['unpaid',f=>{f.invoice.status='open';f.invoice.paid=false;},'ignored'],
 ['test invoice',f=>{f.invoice.livemode=false;},'ignored'],
 ['legacy',f=>{f.sub.metadata.pilot_terms_version='pilot-v1';},'legacy_ignored'],
 ['stale invoice',f=>{f.sub.latest_invoice='in_2';},'historical_ignored'],
 ['expired period',f=>{f.time=f.sub.current_period_end*1000;},'historical_ignored'],
 ['future period',f=>{f.time=f.sub.current_period_start*1000-1;},'historical_ignored']
])test(`${name} opens no paid period`,async()=>{const f=fixture();alter(f);assert.equal(await f.run(),expected);assert.equal(f.writes,0);});
for(const [name,alter] of Object.entries({
 'refunded charge':f=>{f.invoice.payment_intent.latest_charge.amount_refunded=100;},
 'disputed charge':f=>{f.invoice.payment_intent.latest_charge.disputed=true;},
 'uncaptured charge':f=>{f.invoice.payment_intent.latest_charge.captured=false;},
 'zero-dollar invoice':f=>{f.invoice.amount_paid=0;f.invoice.payment_intent.amount_received=0;},
 'incomplete payment':f=>{f.invoice.payment_intent.status='processing';},
 'wrong payment owner':f=>{f.invoice.payment_intent.customer='cus_other';},
 'wrong subscription owner':f=>{f.sub.customer='cus_other';},
 'wrong activation owner':f=>{f.activation.user_id='other_user';},
 'wrong company owner':f=>{f.company.user_id='other_user';},
 'different subscription':f=>{f.activation.stripe_subscription_id='sub_other';},
 'unclaimed activation':f=>{f.activation.claimed_at=null;},
 'canceled activation':f=>{f.activation.canceled_at='2026-11-14T00:00:00Z';},
 'old activation consent':f=>{f.activation.consent_version='pilot-v1';}
}))test(`${name} fails closed without recording`,async()=>{const f=fixture();alter(f);await assert.rejects(f.run());assert.equal(f.writes,0);});
test('webhook arriving before subscription ID save can bind only the claimed matching activation',async()=>{const f=fixture();f.activation.stripe_subscription_id=null;assert.equal(await f.run(),'recorded');assert.equal(f.periods.size,1);});

// Execute the production TS webhook, replacing only provider/runtime boundaries.
// The signature SDK is simulated; these tests prove ordering and routing, not
// Stripe's cryptographic implementation or real webhook transport.
async function webhookFixture({rejectSignature=false,eventMode=true}={}){
 const {readFile}=await import('node:fs/promises');
 const {transform}=await import('esbuild');
 const f=fixture();let handler,dbClients=0,invoiceReads=0,verified=0;
 const originalInvoice=f.stripe.invoices.retrieve;
 f.stripe.invoices.retrieve=async(...args)=>{invoiceReads++;return originalInvoice(...args);};
 f.stripe.webhooks={constructEventAsync:async(body,signature,secret)=>{
  assert.equal(body,'raw fixture payload');assert.equal(signature,'fixture-signature');assert.equal(secret,'fixture-secret');verified++;
  if(rejectSignature)throw Error('Invalid signature');
  return {id:'evt_invoice1',type:'invoice.paid',livemode:eventMode,data:{object:{id:'in_1'}}};
 }};
 const source=(await readFile(new URL('../supabase/functions/stripe-webhook/index.ts',import.meta.url),'utf8')).replace(/^import .*?;$/gm,'');
 const js=await transform(source,{loader:'ts',format:'esm'});
 new Function('Deno','serviceClient','stripe','WEBHOOK_SECRET','recordPaidPeriod','console',js.code)(
  {serve:fn=>{handler=fn;}},()=>{dbClients++;return f.db;},f.stripe,'fixture-secret',
  (id,deps)=>recordPaidPeriod(id,{...deps,now:()=>f.time}),{error:()=>{}});
 return {f,run:()=>handler(new Request('https://example.invalid',{method:'POST',body:'raw fixture payload',headers:{'stripe-signature':'fixture-signature'}})),get verified(){return verified;},get dbClients(){return dbClients;},get invoiceReads(){return invoiceReads;}};
}
test('actual webhook rejects signature before any database client or invoice access',async()=>{const w=await webhookFixture({rejectSignature:true});assert.equal((await w.run()).status,400);assert.equal(w.verified,1);assert.equal(w.dbClients,0);assert.equal(w.invoiceReads,0);assert.equal(w.f.writes,0);});
test('actual signed live invoice.paid route fetches settled invoice and records one period across replay',async()=>{const w=await webhookFixture();assert.equal((await w.run()).status,200);assert.equal(w.invoiceReads,1);assert.equal(w.f.periods.size,1);assert.equal((await w.run()).status,200);assert.equal(w.f.periods.size,1);});
test('actual signed test-mode invoice event never fetches or records a live paid period',async()=>{const w=await webhookFixture({eventMode:false});assert.equal((await w.run()).status,200);assert.equal(w.invoiceReads,0);assert.equal(w.f.writes,0);});
test('actual signed refunded invoice route returns retryable failure and grants no period',async()=>{const w=await webhookFixture();w.f.invoice.payment_intent.latest_charge.amount_refunded=19900;assert.equal((await w.run()).status,500);assert.equal(w.f.writes,0);});
