// Isolated PostgreSQL + actual warning planner/dispatcher; no external transport.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {PGlite}=await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : "@electric-sql/pglite");
import {dispatchWarning} from '../../supabase/functions/_shared/dispatch-usage-warning.mjs';
import {planUsageWarning} from '../../supabase/functions/_shared/paid-usage-warning.mjs';
import {termsVersion} from '../../supabase/functions/_shared/founding-card-pilot.mjs';
const db=new PGlite(), company='00000000-0000-4000-8000-000000000001';
const now=Date.now(),start=now-86400000,end=now+86400000;
let sends=0;
try {
 await db.exec('create role anon;create role authenticated;create role service_role bypassrls;create table roofing_companies(id uuid primary key);');
 for(const file of ['0022_paid_usage_records.up.sql','0023_pack_adjustments.up.sql'])await db.exec(await readFile(new URL('../../supabase/migrations/'+file,import.meta.url),'utf8'));
 await db.query('insert into roofing_companies values($1)',[company]);
 async function period(n){let id=`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;await db.query('insert into roof_paid_periods values($1,$2,$3,to_timestamp($4/1000.0),to_timestamp($5/1000.0))',[id,company,'sub_'+n,start+n,end+n]);return id;}
 const record=(id,i)=>db.query('select record_roof_recovery($1,$2,to_timestamp($3/1000.0))',[id,'call_'+i,now-1000]);
 const rows=id=>db.query('select * from roof_usage_warning_outbox where period_id=$1',[id]);
 const state=async id=>(await rows(id)).rows[0];
 function ports(id,{uncertain=false,suppressAfterClaim=false}={}){let resolutions=0;return {
  async resolve(){if(suppressAfterClaim && ++resolutions===2)return null;let p=(await db.query('select * from roof_paid_periods where id=$1',[id])).rows[0];let calls=(await db.query('select * from roof_recovered_call_receipts where period_id=$1',[id])).rows;return planUsageWarning({companyId:company,startMs:Date.parse(p.starts_at),endMs:Date.parse(p.ends_at),phase:'paid',version:termsVersion,purchasedPacks:0},calls.map(c=>({id:c.provider_event_id,atMs:Date.parse(c.occurred_at),companyId:company,billableRecovered:true})),now);},
  async claim(){return (await db.query("update roof_usage_warning_outbox set delivery_state='claimed' where period_id=$1 and delivery_state='pending' returning period_id",[id])).rows.length===1;},
  async send(mail){sends++;assert.match(mail.text,/65 of your 75/);if(uncertain) return null;return 'fixture_receipt_'+id;},
  async finish(_id,s,receipt){assert.equal((await db.query("update roof_usage_warning_outbox set delivery_state=$2,provider_receipt=$3 where period_id=$1 and delivery_state='claimed' returning period_id",[id,s,receipt])).rows.length,1);}
 };}
 const a=await period(2);for(let i=1;i<=64;i++)await record(a,i);assert.equal((await rows(a)).rows.length,0);await record(a,65);await record(a,65);assert.equal((await rows(a)).rows.length,1);
 assert.equal((await db.query('select count(*)::int n from roof_recovered_call_receipts where period_id=$1',[a])).rows[0].n,65);
 assert.deepEqual((await Promise.all([dispatchWarning(a,ports(a)),dispatchWarning(a,ports(a))])).sort(),['already_handled','provider_accepted']);assert.equal(sends,1);assert.equal((await state(a)).delivery_state,'sent');assert.ok((await state(a)).provider_receipt);assert.equal(await dispatchWarning(a,ports(a)),'already_handled');assert.equal(sends,1);
 const b=await period(3);for(let i=1;i<=65;i++)await record(b,i);await assert.rejects(dispatchWarning(b,ports(b,{uncertain:true})),/acceptance uncertain/);assert.equal((await state(b)).delivery_state,'claimed');assert.equal(await dispatchWarning(b,ports(b)),'already_handled');assert.equal(sends,2);
 const c=await period(4);for(let i=1;i<=65;i++)await record(c,i);assert.equal(await dispatchWarning(c,ports(c,{suppressAfterClaim:true})),'suppressed');assert.equal((await state(c)).delivery_state,'suppressed');assert.equal(sends,2);
 console.log('PASS: 64->65 real recovery receipts queues one warning; duplicate receipt excluded; concurrent dispatch yields one provider attempt and persists receipt.');
 console.log('PASS: uncertain provider response remains claimed and cannot automatically resend; changed eligibility after claim suppresses without sending.');
 console.log('BOUNDARY: planner/dispatcher and PostgreSQL real; provider/auth/subscription resolution represented by fixtures; no external email, production DB, credentials, calls or charges.');
} finally {await db.close();}
