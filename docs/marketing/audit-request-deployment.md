# Missed Revenue Audit intake deployment

The hub now posts audit requests to `/api/audit-request`. The Vercel function validates and normalizes the request, hashes (but never stores) the source IP, and calls a service-role-only Supabase RPC. The RPC atomically enforces five requests per hashed source per hour, persists the request, and creates an admin notification. If the API is unavailable, the browser retains the prepared-email fallback.

## Required deployment steps

1. Apply `supabase/migrations/0020_public_audit_requests.up.sql` to the production Supabase project before publishing the frontend/API change.
2. In the Vercel project, add server-side environment variables for Production and Preview:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AUDIT_RATE_LIMIT_SALT` (generate a random value with `openssl rand -hex 32`)
3. Redeploy a preview and submit one test request. Verify a row exists in `audit_requests` and an `AUDIT_REQUEST` item appears in `admin_notifications`.
4. Confirm the browser success state, then test failure fallback in a preview with the API temporarily unavailable.
5. After production deployment, monitor 4xx/5xx function logs and the audit-request queue daily for the first week.

Never expose the service-role key or rate-limit salt through a `VITE_PUBLIC_*` variable.

## Data and consent

Contact-consent and marketing-consent are separate. The record stores the consent version and timestamp, attribution, submission page, and optional calculator assumptions. Analytics events contain funnel dimensions only; name, email, phone, company, service area, and free text are not sent to the data layer.

Raw IP addresses are not stored. The API creates a salted one-way rate key; rotate the salt if it is exposed. The database RPC uses an advisory transaction lock to prevent concurrent requests from bypassing the hourly limit. A hidden honeypot absorbs basic bots without writing a record.

## Admin notification and follow-up

Each accepted request creates an admin notification containing only the audit request ID. Admin users retrieve the PII from the RLS-protected `audit_requests` table. An email or Slack alert can later subscribe to `AUDIT_REQUEST` notifications, but no automatic outbound message is enabled in this change. Define retention and deletion policy before accumulating production submissions.
