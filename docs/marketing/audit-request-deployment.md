# Missed Revenue Audit intake deployment

The hub now posts audit requests to `/api/audit-request`. The Vercel function validates and normalizes the request, hashes (but never stores) the source IP, and calls a service-role-only Supabase RPC. The RPC atomically enforces five requests per hashed source per hour, persists the request, and creates an admin notification. If the API is unavailable, the browser retains the prepared-email fallback.

## Required deployment steps

1. Apply `supabase/migrations/0020_public_audit_requests.up.sql` to the production Supabase project before publishing the frontend/API change.
2. In the Vercel project, add server-side environment variables for Production and Preview:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AUDIT_RATE_LIMIT_SALT` (generate a random value with `openssl rand -hex 32`)
   - `CRON_SECRET` (generate a separate random value with `openssl rand -hex 32`)
3. Redeploy a preview and submit one test request. Verify a row exists in `audit_requests` and an `AUDIT_REQUEST` item appears in `admin_notifications`.
4. Confirm the browser success state, then test failure fallback in a preview with the API temporarily unavailable.
5. Confirm the audit-retention cron entry in `vercel.json` is enabled, then verify one authenticated run returns `ok: true`.
6. After production deployment, monitor 4xx/5xx function logs and the audit-request queue daily for the first week.

Never expose the service-role key or rate-limit salt through a `VITE_PUBLIC_*` variable.

## Data and consent

Contact-consent and marketing-consent are separate. The record stores the consent version and timestamp, attribution, submission page, and optional calculator assumptions. Analytics events contain funnel dimensions only; name, email, phone, company, service area, and free text are not sent to the data layer.

Raw IP addresses are not stored. The API creates salted one-way IP and email rate keys; rotate the salt if it is exposed. The database RPC uses advisory transaction locks to prevent concurrent requests from bypassing the limits (five submissions per connection/hour and three per email/day). A same-origin check and hidden honeypot handle common automated abuse without writing a record. Client and server requests fail into the prepared-email fallback after 10 and 8 seconds respectively.

## Admin notification and follow-up

Each accepted request creates an admin notification containing only the audit request ID and a secure link to `/admin/audit-requests`. The admin-only queue shows contact details, consent, calculator inputs and attribution, and lets an administrator move each request through `new`, `contacted`, `qualified`, `closed` or `spam`. An email or Slack alert can later subscribe to `AUDIT_REQUEST` notifications, but no automatic outbound message is enabled in this change.

Retention is explicit and enforced by `purge_expired_audit_requests`: one-way rate keys are cleared after 24 hours, spam is deleted after 30 days, and all audit-request records are deleted after 18 months. The Vercel cron endpoint runs this RPC daily. Keep the cron configured and review this policy with counsel before changing the periods.
