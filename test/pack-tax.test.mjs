// Runs the actual webhook; Stripe transport and database writes are isolated.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=readFileSync(new URL('../supabase/functions/stripe-webhook/index.ts',import.meta.url),'utf8').replace(/^import .*?;$/gm,'');
const code=stripTypeScriptTypes(source);
function fixture(calls=20,tax=350) {
  const amount=calls===20?5000:10000;
  const f={rows:new Map(),session:{id:'cs_fixture',payment_intent:'pi_fixture',customer:'cus_fixture',created:1400,metadata:{purpose:'roof_call_pack',pack_calls:String(calls),period_id:'period',company_id:'company'},livemode:true,mode:'payment',payment_status:'paid',currency:'usd',amount_subtotal:amount,amount_total:amount+tax,total_details:{amount_tax:tax,amount_discount:0,amount_shipping:0}},intent:{status:'succeeded',livemode:true,customer:'cus_fixture',currency:'usd',amount_received:amount+tax,latest_charge:{paid:true,captured:true,disputed:false,amount_refunded:0}},item:{quantity:1,price:{id:calls===20?'price_1UXn65CB5wADtZS19CXdROLL':'price_1UXn66CB5wADtZS12VbDpqYh'}}};
  const stripe={webhooks:{constructEventAsync:async()=>({type:'checkout.session.completed',created:1500,data:{object:f.session}})},paymentIntents:{retrieve:async()=>f.intent},checkout:{sessions:{listLineItems:async()=>({data:[f.item],has_more:false})}},subscriptions:{retrieve:async()=>({customer:'cus_fixture'})}};
  const db={from(table){assert.ok(['roof_paid_periods','roof_call_pack_receipts'].includes(table));return {select(){return this},eq(){return this},single:async()=>({data:{id:'period',subscription_id:'sub_fixture',starts_at:new Date(1000e3).toISOString(),ends_at:new Date(2000e3).toISOString()}}),upsert:async(row)=>{f.rows.set(row.stripe_session_id,row);return {}}}}};
  let handler;
  new Function('Deno','serviceClient','stripe','WEBHOOK_SECRET','console',code)({serve:fn=>handler=fn},()=>db,stripe,'fixture',{error(){}});
  f.run=()=>handler(new Request('https://fixture.invalid',{method:'POST',body:'fixture'}));
  return f;
}
for(const calls of [20,50]) for(const tax of [0,350]) test(`${calls} calls: accepts settled tax ${tax} and records pretax pack price once`,async()=>{
  const f=fixture(calls,tax);assert.equal((await f.run()).status,200);assert.equal(f.rows.size,1);assert.equal([...f.rows.values()][0].amount_cents,calls===20?5000:10000);assert.equal((await f.run()).status,200);assert.equal(f.rows.size,1);
});
for(const [label,mutate] of [
  ['total mismatch',f=>f.session.amount_total++],['underpayment',f=>f.intent.amount_received--],['overpayment',f=>f.intent.amount_received++],
  ['discount',f=>f.session.total_details.amount_discount=1],['shipping',f=>f.session.total_details.amount_shipping=1],['negative tax',f=>f.session.total_details.amount_tax=-1],['fractional tax',f=>f.session.total_details.amount_tax=0.5],['missing totals',f=>f.session.total_details=null],['wrong subtotal',f=>f.session.amount_subtotal--],
  ['wrong price',f=>f.item.price.id='price_other'],['wrong quantity',f=>f.item.quantity=2],['wrong currency',f=>f.session.currency='eur'],['wrong customer',f=>f.intent.customer='cus_other'],['refund',f=>f.intent.latest_charge.amount_refunded=1],['dispute',f=>f.intent.latest_charge.disputed=true]
]) test(`rejects ${label} without granting credits`,async()=>{const f=fixture();mutate(f);assert.equal((await f.run()).status,500);assert.equal(f.rows.size,0)});
