# Roof AI Growth Engine v1

An owned, organic-first acquisition funnel for Roof AI Lead Recovery. This is original implementation of a demonstration-led funnel, not a copy of another agency's code, testimonials, or income claims.

## Product

- `/recover.html`: responsive landing page, existing demonstration video, three-step qualification, transparent scenario calculator, consented inquiry capture, optional one-time requested plan email, downloadable text plan, and existing `/signup` handoff.
- `/growth-console.html`: campaign copy and tracked links, protected latest-200 lead pipeline, source totals, stage updates, JSON export and operating status.
- `/api/growth`: server validation, rules-based fit, QA simulation, idempotent intake, existing audit inbox integration, rate limiting, and administrator-only lead access.

The offer remains $299/month with a 7-day free trial; actual checkout terms control. No existing homepage, checkout, subscription, customer phone routing, outreach limit, or campaign has been changed.

## No new platform dependency

Uses existing Vercel, Supabase, SendGrid and GA4. No npm dependency added, agency purchased, ad campaign started, or paid platform provisioned. Existing usage-based provider charges may still apply. The six organic assets are drafts with copy buttons, not automatic posts or newly activated outreach.

## Data and safety

The additive schema is recorded in `docs/growth-schema.sql` and was applied through the Supabase migration `roof_growth_engine_v1`. The new table and two RPCs are service-role only; RLS is enabled, and public/anonymous/authenticated access is revoked. The server validates a real Supabase user token and checks the existing `is_admin()` function before reading or changing lead records. Public HTML contains no lead records or server secrets.

An advisory-locked transaction creates the existing audit record and the associated growth record together. Retrying the same request returns the existing reference without a duplicate email. Existing audit RPC rate limits are reused. Its existing admin notification remains an in-app notification; this addition does not email Jesse.

Contact consent and optional one-time plan-email consent are separate unchecked controls. This form does not authorize SMS, AI calls, or a recurring nurture sequence. SendGrid HTTP 202 means accepted by the provider, not inbox delivery. Email failure never undoes a saved request or falsely claims success. No automated resend is attempted after uncertain delivery.

## Measurement

Campaign tags are restricted to non-personal labels. GA4 runs only on the live marketing hostname outside QA, and does not receive form PII. Intake records retain source tags; signup links carry tags but this version does not assert payment attribution from those tags.

The score is a transparent rules-based indicator, not an AI prediction or validated conversion probability. Economic scenarios are assumptions, not measured losses, guaranteed recoveries, or net profit. Zero economic opportunity routes to audit-first. Dashboard requests, trial-fit requests, stage changes, and trial interest are never called paying customers. Verified collected revenue remains explicitly unverified until authoritative cash reconciliation is connected.

## Tests and operation

Run `node --test test/growth.test.js` with the repository's existing Node ESM configuration. The 32 tests cover numeric bounds, qualification, consent, input validation, QA, cross-origin requests, body size, private data protection, production-path RPC mocks, rate limits, duplicate suppression and email error states. Production-path unit tests mock external services and are not proof of delivered mail.

`/recover.html?qa=1` exercises validation and routing without database writes, email, calls, account creation, or payments; signup navigation is disabled there. Nonproduction deployments also enforce simulation server-side. The public health endpoint `/api/growth?action=health` checks database reachability without exposing records.

Browser rendering and wizard behavior were checked at desktop and 390px mobile width. The local browser harness used isolated HTML and the actual Node QA handler because local network navigation was restricted; it does not establish live video playback or production inbox delivery.

## Explicit boundaries

This version implements the self-service conversion and inquiry-management layer. It does not generate traffic by itself, automatically publish social assets, run paid ads, cold-call prospects, conduct AI sales conversations, or operate a recurring email nurture sequence. A demo request is not a confirmed calendar booking. On-demand video and existing signup avoid requiring a scheduled sales call. Existing billing remains separate, and this release does not change or charge subscriptions.

## Rollback

The addition is isolated to new files. Revert its commit to remove public routes and API without changing the original application. Preserve captured records rather than dropping the growth table during a code rollback. The foreign key follows the existing audit record's deletion lifecycle.
