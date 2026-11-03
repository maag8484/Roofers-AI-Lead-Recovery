// No network, keys, external charges or customer messages. Exercises the PR's
// actual webhook with fixture provider events and real PostgreSQL constraints.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {transform} from 'esbuild';
const {PGlite}=await import(pathToFileURL(process.argv[2]).href), db=new PGlite();
const company='00000000-0000-4000-8000-000000000001', period='00000000-0000-4000-8000-000000000002';
const prices={20:'price_1UXn65CB5wADtZS19CXdROLL',50:'price_1UXn66CB5wADtZS12VbDpqYh'};
let handler,event,item,owner='cus_roof',refunded=0,disputed=false;
try{
 await db.exec('create role anon;create role authenticated;create role service_role bypassrls;create table roofing_companies(id uuid primary key);');
 await db.exec(await readFile(new URL('../../supabase/migrations/0022_paid_usage_records.up.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../../supabase/migrations/0023_pack_adjustments.up.sql',import.meta.url),'utf8'));
 await db.query('insert into roofing_companies values($1)',[company]);
 await db.query("insert into roof_paid_periods values ($1,$2,'sub_roof',to_timestamp(1000),to_timestamp(2000))",[period,company]);
 const lookup={from(table){return {
   select(){assert.equal(table,'roof_paid_periods');const args=[];return {eq(_,v){args.push(v);return this},async single(){return {data:(await db.query('select * from roof_paid_periods where id=$1 and company_id=$2',args)).rows[0]}}};},
   async upsert(row){if(table==='roof_pack_holds'){await db.query('insert into roof_pack_holds values($1,$2,$3) on conflict do nothing',[row.stripe_event_id,row.payment_intent_id,row.reason]);return {};}assert.equal(table,'roof_call_pack_receipts');await db.query('insert into roof_call_pack_receipts(stripe_session_id,payment_intent_id,period_id,price_id,calls,amount_cents,currency) values($1,$2,$3,$4,$5,$6,$7) on conflict(stripe_session_id) do nothing',[row.stripe_session_id,row.payment_intent_id,row.period_id,row.price_id,row.calls,row.amount_cents,row.currency]);return {};}
 };}};
 const stripe={paymentIntents:{retrieve:async(id)=>({latest_charge:{paid:true,captured:true,disputed,amount_refunded:refunded},livemode:true,customer:'cus_roof',currency:'usd',amount_received:id==='pi_20'?5000:10000,status:'succeeded'})},webhooks:{constructEventAsync:async()=>event},checkout:{sessions:{list:async()=>({data:[{livemode:true,mode:"payment",metadata:{purpose:"roof_call_pack"}}]}),listLineItems:async()=>({data:[item],has_more:false})}},subscriptions:{retrieve:async()=>({customer:owner})}};
 const src=(await readFile(new URL('../../supabase/functions/stripe-webhook/index.ts',import.meta.url),'utf8')).replace(/^import .*?;$/gm,'');
 const js=await transform(src,{loader:'ts',format:'esm'});
 new Function('Deno','serviceClient','stripe','WEBHOOK_SECRET',js.code)({serve:fn=>handler=fn},()=>lookup,stripe,'fixture');
 const run=async(n,custom={},type='checkout.session.completed')=>{
  const amount=n===20?5000:10000;
  item={quantity:1,price:{id:prices[n]}};
  event={type,created:1500,data:{object:{id:'cs_'+n,payment_intent:'pi_'+n,customer:'cus_roof',created:1400,metadata:{purpose:'roof_call_pack',pack_calls:String(n),company_id:company,period_id:period},livemode:true,mode:'payment',payment_status:'paid',amount_total:amount,amount_subtotal:amount,currency:'usd',...custom}}};
  return (await handler(new Request('http://localhost',{method:'POST',body:'fixture',headers:{'stripe-signature':'fixture'}}))).status;
 };
 const count=async()=>Number((await db.query('select coalesce(sum(calls),0) n from roof_available_packs')).rows[0].n);
 assert.equal(await run(20,{payment_status:'unpaid'}),200);assert.equal(await count(),0);
 assert.equal(await run(20),200);assert.equal(await count(),20);
 assert.equal(await run(20,{},'checkout.session.async_payment_succeeded'),200);assert.equal(await count(),20);
 assert.equal(await run(50,{amount_total:5000}),500);assert.equal(await count(),20);
 owner='cus_other';assert.equal(await run(50),500);assert.equal(await count(),20);
 owner='cus_roof';refunded=10000;assert.equal(await run(50),500);assert.equal(await count(),20);
 refunded=0;disputed=true;assert.equal(await run(50),500);assert.equal(await count(),20);
 disputed=false;assert.equal(await run(50),200);assert.equal(await count(),70);
 for (const [type,pi,n] of [['charge.refunded','pi_20',50],['charge.refunded','pi_20',50],['charge.dispute.created','pi_50',0]]) {
 event={id:'evt_'+pi,type,livemode:true,data:{object:{payment_intent:pi}}};
 assert.equal((await handler(new Request('http://localhost',{method:'POST',body:'fixture'}))).status,200);assert.equal(await count(),n);
 }
 assert.equal(await run(20),200);assert.equal(await count(),0);
 console.log('PASS: post-payment refund, replay, dispute and late paid replay.');
 console.log('PASS: paid 20/50 packs, actual receipt rows, replay dedupe, unpaid and wrong amount/customer exclusion. Stripe signature and delivery mocked.');
}finally{await db.close();}
