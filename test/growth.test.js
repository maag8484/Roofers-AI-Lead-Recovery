import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{qualify,validate,planText,CONSENT} from '../api/growth.js';
const valid=()=>({requestId:'11111111-1111-4111-8111-111111111111',fullName:'QA Owner',email:'qa@example.com',company:'QA Roofing',serviceArea:'Test, OH',role:'owner',isRoofer:'yes',currentProcess:'voicemail',timing:'now',goal:'audit',contactConsent:true,emailPlan:false,missedCalls:20,legitimateRate:40,closeRate:20,jobValue:8000,margin:25,attribution:{utm_source:'qa_internal'},qa:true});
function mockRes(){return{statusCode:0,headers:{},setHeader(k,v){this.headers[k]=v},end(raw){this.body=JSON.parse(raw)}}}
async function invoke({method='POST',body=valid(),origin='https://www.roofaileadrecovery.com',query={},host='www.roofaileadrecovery.com'}={}){const res=mockRes();await handler({method,body,query,headers:{origin,host},url:'/api/growth'},res);return res}
test('default scenario is mathematically correct, not net profit',()=>{const q=qualify(valid());assert.equal(q.modeledGross,12800);assert.equal(q.modeledContribution,3200);assert.equal(q.score,100);assert.equal(q.fit,'trial-fit');assert.match(q.disclaimer,/not measured/)});
test('nonroofers never get trial-fit or nonzero qualification score',()=>{const q=qualify({...valid(),isRoofer:'no'});assert.equal(q.fit,'not-fit');assert.equal(q.score,0)});
test('zero missed calls goes to audit-first',()=>{assert.equal(qualify({...valid(),missedCalls:0}).fit,'audit-first')});
test('zero margins cannot imply a break-even job count',()=>{assert.equal(qualify({...valid(),margin:0}).breakEvenJobs,null)});
test('invalid numbers do not silently become successful estimates',()=>{for(const value of [-1,Infinity,'',null,'abc',10001])assert.equal(qualify({...valid(),missedCalls:value}).dataComplete,false)});
test('rates above 100 are rejected',()=>{assert.equal(qualify({...valid(),closeRate:101}).dataComplete,false)});
test('legitimate zero opportunity has zero modeled revenue',()=>{assert.equal(qualify({...valid(),legitimateRate:0}).modeledGross,0)});
test('missing explicit contact consent is rejected',()=>{assert.ok(validate({...valid(),contactConsent:'true'}).errors.includes('contactConsent'))});
test('email plan is not implied by contact consent',()=>{assert.equal(validate(valid()).data.emailPlan,false)});
test('email normalization and injection resistance',()=>{assert.equal(validate({...valid(),email:' QA@EXAMPLE.COM '}).data.email,'qa@example.com');assert.ok(validate({...valid(),email:'a@example.com\r\nBcc:x@y.com'}).errors.includes('email'))});
test('bad UUID is rejected',()=>{assert.ok(validate({...valid(),requestId:'x'}).errors.includes('requestId'))});
test('unsupported goal is rejected',()=>{assert.ok(validate({...valid(),goal:'paid_customer'}).errors.includes('goal'))});
test('campaign attribution strips likely personal data',()=>{const v=validate({...valid(),attribution:{utm_source:'me@example.com',utm_content:'5551234567',utm_campaign:'good-label'}}).data.attribution;assert.equal(v.utm_source,undefined);assert.equal(v.utm_content,undefined);assert.equal(v.utm_campaign,'good-label')});
test('QA saves nothing and never calls external services',async()=>{const old=global.fetch;global.fetch=()=>{throw new Error('unexpected network')};try{const r=await invoke();assert.equal(r.statusCode,200);assert.equal(r.body.simulation,true);assert.equal(r.body.saved,false);assert.equal(r.body.emailStatus,'not_sent')}finally{global.fetch=old}});
test('cross-origin intake is forbidden',async()=>{assert.equal((await invoke({origin:'https://evil.example'})).statusCode,403)});
test('malformed JSON is rejected',async()=>{assert.equal((await invoke({body:'{no'})).statusCode,400)});
test('array body is rejected',async()=>{assert.equal((await invoke({body:[]})).statusCode,400)});
test('oversized body is rejected',async()=>{assert.equal((await invoke({body:{...valid(),extra:'x'.repeat(17000)}})).statusCode,413)});
test('honeypot never confirms a persisted lead',async()=>{const r=await invoke({body:{...valid(),website:'spam'}});assert.equal(r.statusCode,202);assert.equal(r.body.saved,false)});
test('pipeline rejects unauthenticated users',async()=>{const r=await invoke({method:'GET',query:{action:'pipeline'}});assert.equal(r.statusCode,401)});
test('stage changes reject unauthenticated users',async()=>{assert.equal((await invoke({method:'PATCH'})).statusCode,403)});
test('unsupported method rejected with Allow header',async()=>{const r=await invoke({method:'DELETE'});assert.equal(r.statusCode,405);assert.match(r.headers.Allow,/POST/)});
test('plan states its assumptions and does not invent booking or payment',()=>{const t=planText({...validate(valid()).data},'test-reference');assert.match(t,/Modeled gross/);assert.match(t,/not been added to an automated marketing sequence/);assert.match(t,/actual checkout terms/);assert.match(CONSENT,/does not authorize/)});
test('valid intake produces no validation errors',()=>{assert.deepEqual(validate(valid()).errors,[])});

test('zero economic opportunity does not recommend a trial',()=>{for(const change of [{margin:0},{legitimateRate:0},{closeRate:0},{jobValue:0}])assert.equal(qualify({...valid(),...change}).fit,'audit-first')});
async function productionRun(responses,bodyChanges={}){
 const names=['VERCEL_ENV','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','AUDIT_RATE_LIMIT_SALT','SENDGRID_API_KEY'];const oldEnv=Object.fromEntries(names.map(k=>[k,process.env[k]]));
 Object.assign(process.env,{VERCEL_ENV:'production',SUPABASE_URL:'https://db.example',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_test_only',AUDIT_RATE_LIMIT_SALT:'test-only-salt',SENDGRID_API_KEY:'SG.test-only'});
 const original=global.fetch,calls=[];global.fetch=async(url,opts={})=>{calls.push({url:String(url),opts});const response=responses.shift();assert.ok(response,'unexpected external request');if(response.error)throw new Error(response.error);return{ok:response.status>=200&&response.status<300,status:response.status,json:async()=>response.body}};
 try{return{response:await invoke({body:{...valid(),qa:false,...bodyChanges}}),calls}}finally{global.fetch=original;for(const k of names){if(oldEnv[k]===undefined)delete process.env[k];else process.env[k]=oldEnv[k]}}
}
const inserted={id:'22222222-2222-4222-8222-222222222222',audit_id:'33333333-3333-4333-8333-333333333333',is_new:true};
test('production save uses atomic RPC, without optional email',async()=>{const {response:r,calls}=await productionRun([{status:200,body:inserted}]);assert.equal(r.statusCode,201);assert.equal(r.body.saved,true);assert.equal(calls.length,1);const sent=JSON.parse(calls[0].opts.body);assert.equal(sent.p_audit.marketing_consent,false);assert.equal(sent.p_audit.ai_demo_requested,false);assert.equal(sent.p_growth.consentText,CONSENT);assert.equal(sent.p_growth.qualification.modeledGross,12800)});
test('requested plan email accepted is not labeled delivered',async()=>{const{response:r,calls}=await productionRun([{status:200,body:inserted},{status:202,body:{}},{status:204,body:null}],{emailPlan:true});assert.equal(r.body.emailStatus,'accepted');assert.equal(calls.length,3);const email=JSON.parse(calls[1].opts.body);assert.equal(email.tracking_settings.click_tracking.enable,false);assert.equal(email.personalizations[0].to[0].email,'qa@example.com')});
test('duplicate intake never sends a second plan email',async()=>{const{response:r,calls}=await productionRun([{status:200,body:{...inserted,is_new:false,email_status:'accepted'}}],{emailPlan:true});assert.equal(r.body.duplicate,true);assert.equal(calls.length,1);assert.equal(r.statusCode,200)});
test('database rate limit prevents email side effects',async()=>{const{response:r,calls}=await productionRun([{status:200,body:{error:'RATE_LIMITED'}}],{emailPlan:true});assert.equal(r.statusCode,429);assert.equal(calls.length,1)});
test('database failure never claims saved or sends email',async()=>{const{response:r,calls}=await productionRun([{status:500,body:{}}],{emailPlan:true});assert.equal(r.statusCode,502);assert.notEqual(r.body.saved,true);assert.equal(calls.length,1)});
test('mail provider error keeps the saved request and truthful status',async()=>{const{response:r}=await productionRun([{status:200,body:inserted},{status:401,body:{}},{status:204,body:null}],{emailPlan:true});assert.equal(r.body.saved,true);assert.equal(r.body.emailStatus,'failed')});
test('unconfirmed email status remains unconfirmed',async()=>{const{response:r}=await productionRun([{status:200,body:inserted},{status:202,body:{}},{status:500,body:{}}],{emailPlan:true});assert.equal(r.body.saved,true);assert.equal(r.body.emailStatus,'status_unconfirmed')});
