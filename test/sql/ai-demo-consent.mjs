// Isolated PostgreSQL/WASM verification; no network, credentials or live writes.
// See docs/marketing/ai-demo-request-review.md for the optional PGlite setup.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { validateAuditRequest, AI_DEMO_CONSENT_VERSION } from "../../api/audit-request.js";

if (!process.argv[2]) throw new Error("Pass the absolute path to an installed @electric-sql/pglite/dist/index.js");
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
let checks = 0;
const verified = (label) => { checks++; console.log(`PASS: ${label}`); };
const migration = (file) => readFile(new URL(`../../supabase/migrations/${file}`, import.meta.url), "utf8");
const input = {
  fullName: "Jamie Roofer", email: "jamie@example.com", company: "Example Roofing",
  serviceArea: "Columbus, OH", phone: "(614) 555-0123", preferredContact: "Email", contactConsent: true,
  aiDemoRequested: true, aiDemoConsentVersion: AI_DEMO_CONSENT_VERSION,
  submissionPage: "https://www.roofaileadrecovery.com/roofing-revenue-recovery/",
};
const { payload } = validateAuditRequest(input);
const ordinary = { ...payload, ai_demo_requested: false, ai_demo_consent: null };
const rpc = async (body, key) => (await db.query(
  "select public.submit_public_audit_request($1::jsonb, $2, $3, 5) as result",
  [JSON.stringify(body), `ip-${key}`, `email-${key}`],
)).rows[0].result;

try {
  // Reproduce the project's actual admin lookup with a local auth.uid() shim.
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    grant usage on schema public to anon, authenticated, service_role;
    create table public.admins(user_id uuid primary key);
    insert into public.admins values ('00000000-0000-0000-0000-000000000001');
  `);
  const adminSql = await migration("0001_admin.sql");
  await db.exec(adminSql.slice(adminSql.indexOf("create or replace function public.is_admin()"), adminSql.indexOf("-- ----------------------------------------------------------------------------\n-- admins table RLS")));
  await db.exec(await migration("0009_admin_notifications.up.sql"));
  await db.exec(await migration("0020_public_audit_requests.up.sql"));
  const before = await rpc(ordinary, "pre-migration");
  await db.exec(await migration("0021_audit_ai_demo_consent.up.sql"));
  const oldRow = (await db.query("select ai_demo_requested, ai_demo_consent from audit_requests where id = $1", [before.id])).rows[0];
  assert.deepEqual(oldRow, { ai_demo_requested: false, ai_demo_consent: null });
  verified("pre-existing rows remain without AI permission");

  const oldClient = { ...ordinary };
  delete oldClient.ai_demo_requested;
  delete oldClient.ai_demo_consent;
  await db.exec("set role service_role");
  const oldResult = await rpc(oldClient, "old-client");
  const result = await rpc({ ...payload, ai_demo_consent: { ...payload.ai_demo_consent, signed_at: "1990-01-01", verified: true } }, "demo");
  await db.exec("reset role");
  assert.equal(oldResult.ai_demo_consent_saved, false);
  assert.ok(oldResult.id);
  verified("the service-only RPC remains compatible with old audit clients");

  const row = (await db.query("select * from audit_requests where id = $1", [result.id])).rows[0];
  assert.equal(result.ai_demo_consent_saved, true);
  assert.equal(row.ai_demo_requested, true);
  assert.deepEqual({ ...row.ai_demo_consent, signed_at: undefined }, { ...payload.ai_demo_consent, signed_at: undefined });
  assert.ok(Math.abs(Date.now() - Date.parse(row.ai_demo_consent.signed_at)) < 60_000);
  assert.equal(row.ai_demo_consent.verified, undefined);
  assert.equal(row.marketing_consent, false);
  assert.equal(row.preferred_contact, "email");
  const notification = (await db.query("select body from admin_notifications where metadata->>'audit_request_id' = $1", [result.id])).rows[0];
  assert.match(notification.body, /Review required/);
  verified("the committed request has exact evidence, database time and an admin review notification");

  const beforeCount = (await db.query("select count(*)::int as n from audit_requests")).rows[0].n;
  await assert.rejects(rpc({ ...payload, ai_demo_consent: null }, "invalid"), /audit_requests_ai_demo_evidence_check/);
  await assert.rejects(rpc({ ...payload, ai_demo_consent: { ...payload.ai_demo_consent, version: "old" } }, "invalid-version"), /audit_requests_ai_demo_evidence_check/);
  assert.equal((await db.query("select count(*)::int as n from audit_requests")).rows[0].n, beforeCount);
  verified("incomplete or stale evidence aborts the database insert");

  await assert.rejects(db.query("update audit_requests set ai_demo_requested = false, ai_demo_consent = null where id = $1", [result.id]), /evidence is immutable/);
  verified("saved AI permission cannot be rewritten, even by the table owner");

  await db.exec("set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001'");
  assert.equal((await db.query("select count(*)::int as n from audit_requests")).rows[0].n, beforeCount);
  assert.equal((await db.query("update audit_requests set status = 'contacted' where id = $1", [result.id])).affectedRows, 1);
  await assert.rejects(db.query("update audit_requests set ai_demo_consent = null where id = $1", [result.id]), /permission denied/);
  verified("admins can read requests and update status while consent editing stays forbidden");

  await db.exec("set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002'");
  assert.equal((await db.query("select count(*)::int as n from audit_requests")).rows[0].n, 0);
  assert.equal((await db.query("update audit_requests set status = 'closed' where id = $1", [result.id])).affectedRows, 0);
  await assert.rejects(rpc(payload, "non-admin"), /permission denied/);
  await db.exec("reset role; set role anon");
  await assert.rejects(db.query("select * from audit_requests"), /permission denied/);
  await assert.rejects(rpc(payload, "anon"), /permission denied/);
  await db.exec("reset role");
  verified("non-admin and anonymous users cannot retrieve permission, edit rows or invoke intake directly");

  for (let i = 0; i < 3; i++) assert.ok((await rpc(ordinary, "rate-test")).id);
  assert.equal((await rpc(ordinary, "rate-test")).error, "RATE_LIMITED");
  verified("the existing per-email rate limit still blocks a fourth submission");

  await db.query("update audit_requests set created_at = now() - interval '2 days' where id = $1", [result.id]);
  await db.exec("select public.purge_expired_audit_requests()");
  const purged = (await db.query("select rate_key, email_key, ai_demo_consent from audit_requests where id = $1", [result.id])).rows[0];
  assert.equal(purged.rate_key, null);
  assert.equal(purged.email_key, null);
  assert.deepEqual(purged.ai_demo_consent, row.ai_demo_consent);
  verified("routine rate-key cleanup preserves the consent evidence");
  console.log(`${checks} database checks passed; no live services were contacted.`);
} finally {
  await db.close();
}
