import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
import {termsVersion} from '../supabase/functions/_shared/founding-card-pilot.mjs';
import {consentCopy,founderContext,ownedSetup} from '../supabase/functions/_shared/founding-card-setup.mjs';
const source=(await readFile(new URL('../supabase/functions/founding-card-setup/index.ts',import.meta.url),'utf8')).replace(/^import .*?;$/gm,'');
const js=(await transform(source,{loader:'ts',format:'esm'})).code;
function fixture(){
 const f={ready:true,requests:[],user:{id:'owner',email:'owner@example.invalid',email_confirmed_at:'2026-11-01',app_metadata:{roof_founding_offer:{version:termsVersion,status:'reserved',user_id:'owner',reservation_id:'r1',stripe_customer_id:'cus_owner'}}}};
 const stripe={customers:{retrieve:async()=>({email:'owner@example.invalid',metadata:{supabase_user_id:'owner'}})},checkout:{sessions:{create:async(p,o)=>{f.requests.push({p,o});return {url:'https://checkout.stripe.com/c/pay/fixture'};}}}};
 new Function('Deno','handleOptions','json','getUser','stripe','STRIPE_MODE','termsVersion','consentCopy','founderContext','ownedSetup',js)(
  {serve:h=>{f.handler=h},env:{get:()=>String(f.ready)}},()=>null,(v,status=200)=>Response.json(v,{status}),async()=>({user:f.user}),stripe,'live',termsVersion,consentCopy,founderContext,ownedSetup);
 f.call=body=>f.handler(new Request('https://example.invalid',{method:'POST',body:JSON.stringify(body)}));return f;
}
const input={action:'start',accepted:true,terms:termsVersion,request_id:'11111111-1111-4111-8111-111111111111'};
test('card setup stores explicit consent, collects tax address and uses stable request key without a payment',async()=>{
 const f=fixture();assert.equal((await f.call(input)).status,200);assert.equal((await f.call(input)).status,200);
 const {p,o}=f.requests[0];assert.equal(p.mode,'setup');assert.equal(p.customer,'cus_owner');assert.equal(p.billing_address_collection,'required');assert.deepEqual(p.customer_update,{address:'auto'});
 assert.deepEqual(p.payment_method_types,['card']);assert.equal(p.metadata.consent_text,consentCopy);assert.equal(p.setup_intent_data.metadata.consent_request,input.request_id);
 assert.equal(p.line_items,undefined);assert.deepEqual(f.requests[1],{p,o});
});
test('disabled setup, no consent, legacy offers and forged user metadata never create a session',async()=>{
 let f=fixture();f.ready=false;assert.equal((await f.call(input)).status,503);assert.equal(f.requests.length,0);
 f=fixture();assert.equal((await f.call({...input,accepted:false})).status,400);assert.equal(f.requests.length,0);
 f=fixture();f.user.app_metadata.roof_founding_offer.version='pilot-30d-40calls-v1';assert.equal((await f.call(input)).status,403);assert.equal(f.requests.length,0);
 f=fixture();f.user.user_metadata=f.user.app_metadata;f.user.app_metadata={};assert.equal((await f.call(input)).status,403);assert.equal(f.requests.length,0);
});
