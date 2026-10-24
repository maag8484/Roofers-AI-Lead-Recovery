import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createHandler } from '../api/vapi-followup.js';
import { verifySignature } from '../api/vapi-email-events.js';
import { INTERNAL_ASSISTANT, verifyEmailRequest, validateSource, PRODUCTION_ASSISTANT } from '../server/vapi-followup.js';
const callId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', deliveryId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const now=Date.now(), email='owner@roofcompany.com';
const call={id:callId,status:'ended',assistantId:INTERNAL_ASSISTANT,startedAt:new Date(now-90000).toISOString(),endedAt:new Date(now-1000).toISOString(),messages:[{role:'bot',message:`May I email the signup link to ${email}?`},{role:'user',message:'Yes please.'}]};
const env={VAPI_FOLLOWUP_TOKEN:'x'.repeat(32),VAPI_FOLLOWUP_MODE:'test',VAPI_FOLLOWUP_TEST_TO:email,VAPI_FOLLOWUP_FROM:'support@roofaileadrecovery.com',SUPABASE_URL:'https://db.invalid',SUPABASE_SERVICE_ROLE_KEY:'secret',VAPI_PRIVATE_API_KEY:'secret',SENDGRID_API_KEY:'secret'};
function fixture(options={}) {
 let claimed=false,sends=0;
 const fetcher=async(url,init={})=>{
  if(url.includes('api.vapi.ai')) return Response.json(options.call || call);
  if(url.includes('claim_vapi')) {const first=!claimed;claimed=true;return Response.json({claimed:first,id:deliveryId,status:'claimed'});}
  if(url.includes('finish_vapi')) {if(options.dbFailure)throw Error('offline');return Response.json({recorded:true});}
  if(url.endsWith('/mail/send')) {sends++;if(options.timeout)throw Error('timeout');return new Response(null,{status:202});}
  return Response.json(options.suppressed ? [{email}] : []);
 };
 const handler=createHandler({env:{...env,...options.env},fetcher,clock:()=>now});
 const invoke=async(body={},auth=true)=>{let value;const res={setHeader(){},end(v){value=JSON.parse(v);}};await handler({method:'POST',headers:{authorization:auth?`Bearer ${env.VAPI_FOLLOWUP_TOKEN}`:''},body:{source_call_id:callId,suppression_check:{source_call_id:callId,email,phone_e164:'',checked_at:new Date(now).toISOString(),phone_clear:true,email_clear:true,revocation_clear:true},...body}},res);return {...value,httpStatus:res.statusCode};};
 return {invoke,sends:()=>sends};
}
test('requires authoritative explicit request and exact recipient; rejects later correction and opt-out',()=>{
 assert.equal(verifyEmailRequest(call,email).answer,'Yes please.');
 assert.throws(()=>verifyEmailRequest(call,'other@roofcompany.com'));
 for (const question of [`May I email the signup link to ${email}.evil?`, `Should I avoid emailing the signup link to ${email}?`]) {
  assert.throws(()=>verifyEmailRequest({...call,messages:[{role:'bot',message:question},call.messages[1]]},email));
 }
 for(const text of ['Actually use another address','Stop calling','No thanks']) assert.throws(()=>verifyEmailRequest({...call,messages:[...call.messages,{role:'user',message:text}]},email));
 assert.throws(()=>verifyEmailRequest({...call,messages:[{role:'user',message:'yes'}]},email));
});
test('live source requires recorded consent and matching destination',()=>{
 const id='cccccccc-cccc-4ccc-8ccc-cccccccccccc',phone='+14155552671';
 const live={...call,assistantId:PRODUCTION_ASSISTANT,metadata:{audit_request_id:id},customer:{number:phone}};
 const audit={id,email,phone,status:'new',contact_consent:true,ai_demo_requested:true,ai_demo_consent:{version:'ai-demo-call-v1',scope:'roof_ai_ai_voice_sales_demo',max_calls:1,text:'consent',signer_name:'Owner',signed_at:new Date(now-100000).toISOString(),phone_e164:phone}};
 assert.equal(validateSource(live,audit,{mode:'live',now}).recipient,email);
 assert.throws(()=>validateSource(live,{...audit,phone:'+12125552671'},{mode:'live',now}));
 assert.throws(()=>validateSource(live,{...audit,ai_demo_requested:false},{mode:'live',now}));
});
test('unauthorized, disabled, preview live and stale suppression never send',async()=>{
 const f=fixture();assert.equal((await f.invoke({},false)).httpStatus,401);
 assert.equal((await f.invoke({suppression_check:{}})).httpStatus,409);assert.equal(f.sends(),0);
 assert.equal((await fixture({env:{VAPI_FOLLOWUP_MODE:'off'}}).invoke()).httpStatus,503);
 assert.equal((await fixture({env:{VAPI_FOLLOWUP_MODE:'live',VERCEL_ENV:'preview'}}).invoke()).httpStatus,503);
 const suppressed=fixture({suppressed:true});assert.equal((await suppressed.invoke()).httpStatus,409);assert.equal(suppressed.sends(),0);
});
test('concurrent replays make one dispatch; acceptance is not delivery',async()=>{
 const f=fixture();const results=await Promise.all([f.invoke(),f.invoke()]);assert.equal(f.sends(),1);
 assert.equal(results.find(r=>r.httpStatus===202).delivered,false);
});
test('ambiguous provider or persistence failure never automatically resends',async()=>{
 for(const options of [{timeout:true},{dbFailure:true}]) {const f=fixture(options);assert.ok((await f.invoke()).httpStatus>=500);await f.invoke();assert.equal(f.sends(),1);}
});
test('event signature authenticates exact raw payload and timestamp',()=>{
 const {privateKey,publicKey}=crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
 const key=publicKey.export({type:'spki',format:'der'}).toString('base64'),raw=Buffer.from('[ {"event":"delivered"} ]');
 const timestamp='1789380000';const signature=crypto.sign('sha256',Buffer.concat([Buffer.from(timestamp),raw]),privateKey).toString('base64');
 const headers={'x-twilio-email-event-webhook-timestamp':timestamp,'x-twilio-email-event-webhook-signature':signature};
 assert.equal(verifySignature(raw,headers,key),true);assert.equal(verifySignature(Buffer.from('[]'),headers,key),false);
 assert.equal(verifySignature(raw,{...headers,'x-twilio-email-event-webhook-timestamp':'1'},key),false);
});
test('real SQL ledger deduplicates claims/events and preserves early delivery and suppression',async()=>{
 const db=new PGlite();
 try {
 await db.exec('create role anon; create role authenticated; create role service_role; create table public.audit_requests(id uuid primary key);');
 await db.exec(await readFile(new URL('../supabase/migrations/0022_vapi_signup_delivery.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../supabase/migrations/20260914193245_vapi_preserve_audit_cleanup.sql',import.meta.url),'utf8'));
 const auditId='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
 await db.query('insert into audit_requests(id) values($1)',[auditId]);
 const row={source_call_id:callId,audit_request_id:auditId,recipient:email,phone_e164:'',test_mode:true,confirmation:{answer:'yes'},template_version:'test'};
 const claim=async()=> (await db.query('select claim_vapi_signup_delivery($1::jsonb) as result',[JSON.stringify(row)])).rows[0].result;
 const a=await claim();assert.equal(a.claimed,true);assert.equal((await claim()).claimed,false);
 await db.query('delete from audit_requests where id=$1',[auditId]);
 assert.equal((await db.query('select audit_request_id from vapi_signup_deliveries where id=$1',[a.id])).rows[0].audit_request_id,null);
 row.audit_request_id=null;
 assert.equal((await claim()).claimed,false);
 const event={delivery_id:a.id,email,event_id:'event1',event:'delivered',timestamp:now/1000};
 const record=async()=> (await db.query('select record_vapi_delivery_event($1::jsonb) as result',[JSON.stringify(event)])).rows[0].result;
 assert.equal((await record()).recorded,true);assert.equal((await record()).duplicate,true);
 await db.query("select finish_vapi_signup_delivery($1,'accepted','provider',202)",[a.id]);
 assert.equal((await db.query('select status from vapi_signup_deliveries')).rows[0].status,'delivered');
 event.event='unsubscribe';event.event_id='event2';await record();
 row.source_call_id=deliveryId;assert.equal((await claim()).status,'suppressed');
 event.event='delivered';event.event_id='event3';await record();
 assert.equal((await db.query('select status from vapi_signup_deliveries')).rows[0].status,'unsubscribe');
 await db.exec('set role anon;');
 await assert.rejects(()=>db.query('select * from vapi_signup_deliveries'));
 await assert.rejects(()=>db.query('select claim_vapi_signup_delivery($1::jsonb)',[JSON.stringify(row)]));
 } finally {await db.close();}
});
