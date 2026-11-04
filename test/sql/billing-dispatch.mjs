// Isolated PostgreSQL semantics with a fake HTTP queue. No network or production credentials.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {PGlite}=await import(pathToFileURL(process.argv[2]).href);
const db=new PGlite();
const uuid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const query=(sql,p=[])=>db.query(sql,p);
const scalar=async sql=>Object.values((await query(sql)).rows[0])[0];
const migration=async name=>db.exec(await readFile(new URL(`../../supabase/migrations/${name}`,import.meta.url),'utf8'));
try {
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.user_id',true),'')::uuid$$;
 grant usage on schema auth to authenticated,service_role;
 create table roofing_companies(id uuid primary key,user_id uuid references auth.users(id),is_live boolean,details_submitted boolean);
 create schema vault;create table vault.decrypted_secrets(name text primary key,decrypted_secret text);
 create schema net;create table net.calls(id bigint generated always as identity primary key,url text,headers jsonb,body jsonb);
 create function net.http_post(url text,headers jsonb,body jsonb,timeout_milliseconds integer) returns bigint language plpgsql as $$declare n bigint;begin insert into net.calls(url,headers,body) values(url,headers,body) returning id into n;return n;end;$$;`);
 await migration('0022_paid_usage_records.up.sql');
 await migration('0024_founder_activation_and_cancel.up.sql');
 await migration('0025_owner_trial_status.up.sql');
 await migration('0026_billing_dispatch.up.sql');
 for(let n=1;n<=8;n++){
  await query('insert into auth.users values($1)',[uuid(n)]);
  await query('insert into roofing_companies values($1,$2,true,true)',[uuid(100+n),uuid(n)]);
  await query("insert into roof_founder_activations(reservation_id,user_id,company_id,customer_id,setup_session_id,live_test_receipt,activated_at,consent_version) values($1,$2,$3,$4,$5,$6,now()-interval '336 hours 30 minutes','pilot-14d-40calls-199-card-v4')",[`r${n}`,uuid(n),uuid(100+n),`cus_${n}`,`cs_${n}`,`receipt_${n}`]);
 }
 await db.exec(`update roof_founder_activations set activated_at=now()-interval '335 hours' where reservation_id='r2';
 update roof_founder_activations set activated_at=now()-interval '338 hours' where reservation_id='r3';
 update roof_founder_activations set canceled_at=now() where reservation_id='r4';
 update roof_founder_activations set claimed_at=now()-interval '20 minutes' where reservation_id='r5';
 update roof_founder_activations set stripe_subscription_id='sub_6' where reservation_id='r6';
 update roofing_companies set is_live=false where id='${uuid(107)}';`);
 assert.equal(await scalar('select dispatch_roof_billing_jobs()'),0);
 assert.equal(Number(await scalar('select count(*) from net.calls')),0);
 await db.exec('set role authenticated');
 await assert.rejects(query('select dispatch_roof_billing_jobs()'),/permission denied/);
 await assert.rejects(query("select * from claim_due_roof_founder_trial('r1')"),/permission denied/);
 await query("select set_config('test.user_id',$1,false)",[uuid(2)]);
 assert.equal(await scalar("select cancel_roof_founder_trial('r8')"),false);
 await query("select set_config('test.user_id',$1,false)",[uuid(8)]);
 assert.equal(await scalar("select cancel_roof_founder_trial('r8')"),true);
 assert.equal(await scalar("select cancel_roof_founder_trial('r8')"),true);
 const visible=await query('select * from my_roof_founder_trial()');assert.deepEqual(visible.rows.map(r=>r.reservation_id),['r8']);assert.ok(visible.rows[0].canceled_at);
 await db.exec('reset role;set role service_role');
 assert.equal((await query("select * from claim_due_roof_founder_trial('r8')")).rows.length,0);
 await db.exec('reset role');
 await db.exec('update roof_billing_control set billing_enabled=true');
 await assert.rejects(query('select dispatch_roof_billing_jobs()'),/Missing founder worker configuration/);
 await query('insert into vault.decrypted_secrets values($1,$2),($3,$4)',['roof_founder_worker_secret','f'.repeat(40),'roof_warning_worker_secret','w'.repeat(40)]);
 assert.equal(await scalar('select dispatch_roof_billing_jobs()'),1);
 let calls=(await query('select * from net.calls')).rows;assert.deepEqual(calls.map(x=>x.body),[{reservation_id:'r1'}]);assert.ok(calls[0].url.endsWith('/bill-due-founder'));
 await db.exec('set role service_role');
 assert.equal((await query("select * from claim_due_roof_founder_trial('r1')")).rows.length,1);
 assert.equal((await query("select * from claim_due_roof_founder_trial('r1')")).rows.length,0);
 await db.exec('reset role;set role authenticated');
 await query("select set_config('test.user_id',$1,false)",[uuid(1)]);
 assert.equal(await scalar("select cancel_roof_founder_trial('r1')"),false);
 await db.exec('reset role');
 assert.equal(await scalar('select dispatch_roof_billing_jobs()'),0);
 for(let n=1;n<=4;n++){
  await query("insert into roof_paid_periods(id,company_id,subscription_id,starts_at,ends_at) values($1,$2,$3,now()-interval '1 hour',now()+interval '1 hour')",[uuid(200+n),uuid(100+n),`sub_p${n}`]);
  await query("insert into roof_usage_warning_outbox(period_id,delivery_state,provider_receipt) values($1,$2,'fixture_receipt')",[uuid(200+n),n===2?'claimed':n===3?'sent':'pending']);
 }
 await query("update roof_paid_periods set starts_at=now()-interval '2 hours',ends_at=now()-interval '1 hour' where id=$1",[uuid(204)]);
 await db.exec('update roof_billing_control set warnings_enabled=true');
 assert.equal(await scalar('select dispatch_roof_billing_jobs()'),1);
 calls=(await query('select * from net.calls order by id')).rows;assert.deepEqual(calls[1].body,{period_id:uuid(201)});assert.ok(calls[1].url.endsWith('/dispatch-usage-warning'));
 const attention=(await query('select * from roof_billing_attention')).rows;
 assert.ok(attention.some(r=>r.source_id==='r3'&&r.reason==='overdue_manual_review'));
 assert.ok(attention.some(r=>r.source_id==='r5'&&r.reason==='charge_unreconciled'));
 assert.ok(attention.some(r=>r.source_id===uuid(202)&&r.reason==='delivery_unreconciled'));
 assert.equal(Number(await scalar('select count(*) from roof_billing_dispatch_receipts')),2);
 console.log('Passed: migrations0024/25/26, owner-only cancellation/status, atomic claims, disabled default, missing-secret guard, exact due/pending eligibility, dispatch receipts and attention.');
} finally {await db.close();}
