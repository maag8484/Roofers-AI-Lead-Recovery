# Billing completion release

This release wires verified pilot activation to a due-charge worker, settled invoices to paid periods, optional account purchases to verified pack fulfillment, and counted recoveries to a deduplicated warning dispatcher. Prior accepted no-card offers retain their terms. No automatic pack purchase is implemented.

## Installation and operating contract

1. Apply migration 0026 after existing migrations 0022–0025. It creates disabled billing/warning controls, HTTP dispatch receipts and an operations attention view. Install the named five-minute schedule in `billing-schedule.sql`; its default disabled controls make it a no-op.
2. Deploy `founding-card-setup`, `record-founder-activation`, `bill-due-founder`, `paid-pack-checkout`, `dispatch-usage-warning`, and `stripe-webhook`, including each relative shared import. Retain JWT verification for customer-facing functions; worker functions use separate strong bearer secrets and the Stripe webhook verifies its signature.
3. Add `invoice.paid` to the existing webhook endpoint without removing its subscription, checkout, refund or dispute events. The webhook retrieves current Stripe state through its pinned API client; an event payload is not current account state.
4. Before a new founder is reserved, reconcile earlier commitments and bind a confirmed external account, company, Stripe customer and unique reservation in server-owned `app_metadata.roof_founding_offer`. A signup alone does not reserve a place. Never migrate older accepted offers automatically.
5. After explicit card consent, a trusted installation worker must call `record-founder-activation` with `company_id`, completed `setup_session`, unique provider live-test `receipt`, and `live_test_at`. The company must be configured/live. Replays preserve the original date. The first charge is 336 hours later; cancellation is serialized against the charge claim. After a missed one-hour charging window, review manually rather than issuing a surprise late charge.
6. The verified Smith.ai ingestion worker must call existing `record_roof_recovery(period,event,occurred_at)` only for independently verified recovered calls in the matching current paid period. It must preserve provider event IDs and customer mapping. Signup, owner QA and call attempts are not recoveries. This repository does not claim that the external provider mapping has been independently exercised.
7. Store strong independent worker tokens as Edge secrets (`ROOF_FOUNDER_WORKER_SECRET`, `ROOF_WARNING_WORKER_SECRET`, `ROOF_FOUNDER_ACTIVATION_SECRET`) and corresponding scheduler Vault names `roof_founder_worker_secret` / `roof_warning_worker_secret`. Never print them. Readiness flags are `ROOF_CARD_SETUP_READY`, `ROOF_FOUNDER_ACTIVATION_READY`, `ROOF_FOUNDER_BILLING_READY`, `ROOF_PACK_FULFILLMENT_READY`, `ROOF_USAGE_EMAIL_READY`. Leave them disabled until the release checks below pass. The warning requires a verified SendGrid business sender and `SENDGRID_API_KEY`.

## Release checks still requiring provider access

Use a separate Stripe sandbox and isolated database fixtures. Never switch the live project's global Stripe mode to run QA. Exercise actual hosted card setup and saved billing address, activation, cancellation before day 14, day-14 first invoice with the founding discount, the thirteenth paid month at standard price, optional 20/50-call purchases, duplicate/out-of-order events and refunds/disputes. Verify first-time promotion eligibility and tax calculation using the actual provider response.

Exercise the real call-provider mapping through the 65-call threshold and verify one intended-owner warning in the recipient inbox, with provider acceptance and delivery receipts. The local tests simulate Stripe and SendGrid boundaries and cannot establish this delivery. Do not create production customer/test signups or charges as substitutes.

After these checks, enable the relevant Edge flags and then the corresponding `roof_billing_control` fields. Inspect `roof_billing_attention`, dispatch HTTP responses and Stripe/provider receipts. A claimed uncertain charge or email must be reconciled before any retry. `roof_billing_dispatch_receipts` establishes only that an HTTP request was queued.

## Validation

`npm test` exercises real handler functions and rendered components with isolated external boundaries. `npm run build` validates the web bundle. `test/sql/paid-usage.mjs`, `test/sql/pack-fulfillment.mjs`, and `test/sql/billing-dispatch.mjs` run actual migrations/handlers in an isolated PGlite database; pass the installed PGlite module path as the first argument. None of these tests sends email or charges a card.
