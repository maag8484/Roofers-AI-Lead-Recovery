// Runs entirely in memory; never connects to Supabase, Stripe, or an email provider.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {PGlite}=await import(pathToFileURL(process.argv[2]).href);
const db=new PGlite();
try {
await db.exec('create role anon; create role authenticated; create role service_role bypassrls; create table public.roofing_companies(id uuid primary key);');
await db.exec(await readFile(new URL('../../supabase/migrations/0022_paid_usage_records.up.sql',import.meta.url),'utf8'));
const [company,period] = ['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'];
await db.query('insert into roofing_companies values($1)',[company]);
await db.query("insert into roof_paid_periods values ($1,$2,'sub_fixture',now()-interval '1 hour',now()+interval '1 hour')",[period,company]);
const record=async i=>db.query('select public.record_roof_recovery($1,$2,now())',[period,String(i)]);
const count=async table=>Number((await db.query('select count(*) n from '+table)).rows[0].n);
await db.exec('set role authenticated');
await assert.rejects(record(1),/permission denied/);
await db.exec('reset role; set role service_role');
for(let i=1;i<=64;i++) await record(i);
await record(64);
assert.equal(await count('roof_usage_warning_outbox'),0);
await record(65);await record(65);await record(66);
assert.equal(await count('roof_usage_warning_outbox'),1);
assert.equal(await count('roof_recovered_call_receipts'),66);
await assert.rejects(db.query("select record_roof_recovery($1,'late',now()+interval '2 hours')",[period]),/Invalid recovery/);
console.log('Passed: private access, 64/65 threshold, replay dedupe, period boundary.');
} finally {await db.close();}
