# Missed Revenue Audit intake deployment

For the optional AI demo request extension, use [the AI demo review and deployment notes](./ai-demo-request-review.md), including migration 0021 and the separate consent confirmation behavior. The prepared-email fallback below applies to ordinary audit requests; it does not capture AI-call permission.

The hub posts audit requests to `/api/audit-request`. The Vercel function validates and normalizes the request, hashes (but never stores) the source IP, and calls a service-role-only Supabase RPC. The RPC atomically enforces five requests per hashed source per hour, persists the request, and creates an admin notification. Audit CTAs explicitly open the on-page dialog. If the API is unavailable or confirmation times out, the form retains the visitor's details and offers an optional email fallback; it never automatically launches email.

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

## Conversion analytics

The shared revenue-hub script loads the existing Google Tag Manager container (`GTM-WKMDN97L`) on the static hub pages and emits two qualified-intent events:

- `calculator_complete` fires once per page view after all four calculator inputs contain valid positive values and the visitor commits the completed scenario by changing focus or submitting the form.
- `audit_submit` fires only after `/api/audit-request` returns HTTP 201 with `ok: true` and a non-empty request ID. Validation errors, rate limits, API failures, unconfirmed 2xx responses, timeouts and email fallbacks do not count as submissions. The deadline covers response headers and body. Repeated submits while pending or after confirmation cannot double-count.

Both events include `page_path`, `traffic_source`, `traffic_medium`, `traffic_campaign`, `traffic_content`, and a non-identifying `revenue_risk_band`. `calculator_complete` also includes `calculator_version`; `audit_submit` includes CTA location, preferred contact, and whether a calculator scenario was attached. The existing `audit_form_submitted` event remains temporarily for backwards-compatible reporting.

On September 14, the live GTM container was verified empty (no tags, predicates or rules). The existing GA4 property is 550219711, web measurement ID `G-8PV83SZ3X0`, under Roof AI Lead Recovery. The shared script now loads that Google tag directly on the production domain and forwards exactly `calculator_complete` and `audit_submit` with their non-PII dimensions. Keep the dataLayer events for debugging and future GTM migration. Do not add duplicate GTM conversion tags unless removing this direct sender in the same release. Preview hosts emit local dataLayer events but do not load the production Google tag.

In GA4, mark both event names as key events and register `traffic_source`, `traffic_medium`, `traffic_campaign`, `traffic_content` and `revenue_risk_band` as event-scoped custom dimensions. This admin configuration must be verified separately; deploying the JavaScript does not prove the key-event flags exist. Standard GA4 campaign acquisition dimensions also identify tagged visits. Verify Realtime/DebugView collection before treating dashboard counts as production data.

Session attribution survives internal hub navigation. A new tagged campaign replaces the session campaign as a whole, preventing YouTube conversions from borrowing omitted fields from an earlier LinkedIn visit. The first-touch record remains available unchanged; saved audit attribution and conversion events use the same selected campaign.

Raw IP addresses are not stored. The API creates salted one-way IP and email rate keys; rotate the salt if it is exposed. The database RPC uses advisory transaction locks to prevent concurrent requests from bypassing the limits (five submissions per connection/hour and three per email/day). A same-origin check and hidden honeypot handle common automated abuse without writing a record. Client and server requests fail into the prepared-email fallback after 10 and 8 seconds respectively.

## Admin notification and follow-up

Each accepted request creates an admin notification containing only the audit request ID and a secure link to `/admin/audit-requests`. The admin-only queue shows contact details, consent, calculator inputs and attribution, and lets an administrator move each request through `new`, `contacted`, `qualified`, `closed` or `spam`.

When `SENDGRID_API_KEY` is configured for the Vercel deployment, each accepted request also sends a non-blocking internal email alert. Set `AUDIT_NOTIFICATION_FROM` to a verified SendGrid sender and `AUDIT_NOTIFICATION_TO` to the inbox that should receive new-request alerts. Email delivery failures do not reject or discard a request; the admin notification and audit queue remain the source of truth.

Retention is explicit and enforced by `purge_expired_audit_requests`: one-way rate keys are cleared after 24 hours, spam is deleted after 30 days, and all audit-request records are deleted after 18 months. The Vercel cron endpoint runs this RPC daily. Keep the cron configured and review this policy with counsel before changing the periods.
