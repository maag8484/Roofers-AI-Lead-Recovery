# Callback acquisition release — October 15, 2026

## Visitor path

The homepage offers a walkthrough of missed-call recovery for the visitor's roofing company. The existing missed-call text-back guide now provides the same short callback form directly on the page. Both ask for name, email, phone and explicit permission for a human callback. A business street address is no longer required. The original audit flow continues to require its own qualification fields. No AI calls or marketing texts are authorized by the callback form.

The shared `public/callback-client.js` sends callback inquiries to the existing `/api/audit-request` endpoint. API mapping retains the inbox's non-null service-area field using the explicit placeholder `Not collected — callback inquiry` when no legacy address is supplied. No schema, routing, recovery engine or payment changes are required.

## Tracking links ready to use

These are destinations only; this release does not send messages or edit Apollo campaigns.

- Jesse: https://www.roofaileadrecovery.com/resources/roofing-missed-call-text-back/?utm_source=jesse&utm_medium=phone&utm_campaign=callback_walkthrough#inquiry
- Email: https://www.roofaileadrecovery.com/resources/roofing-missed-call-text-back/?utm_source=apollo&utm_medium=email&utm_campaign=callback_walkthrough#inquiry
- Referrals: https://www.roofaileadrecovery.com/resources/roofing-missed-call-text-back/?utm_source=partner&utm_medium=referral&utm_campaign=callback_walkthrough#inquiry

Use a partner-specific nonpersonal `utm_content` identifier when appropriate. Use links only where delivery and channel approval support them; this is not a reason to override any inbox-recovery restrictions.

## Analytics and source attribution

- `callback_cta_clicked`: navigation toward the form; secondary intent only.
- `callback_form_started`: first focus in a callback form per document; secondary intent only.
- `callback_form_error`: bounded error type, without contact information.
- `callback_inquiry_submit`: one successful frontend submission, only after HTTP 201, `ok: true` and a nonempty server request ID. This is a saved inquiry, not a held demo or a paying customer.

Events use `gtag('event', ...)` and the existing stream `G-8PV83SZ3X0`. Names, contact details, consent text and request IDs are not sent to analytics. A same-session campaign survives navigation from the guide to the homepage. A new tagged visit replaces the previous campaign; arbitrary URL fields and referrer queries are discarded. Preview hosts and QA visits (`?qa=1` or `utm_source=qa_internal`, persisting through the session) do not emit production callback events.

GA4 report access and Google Ads access require their own OAuth connections; Search Console authorization does not grant either. Source implementation tests do not establish GA4 ingestion. Before paid activation, verify the correct stream and a controlled saved inquiry, confirm the event in Realtime/DebugView, mark only the saved inquiry as a key event and import it once into Google Ads. Exclude automatic `form_submit`, clicks and form starts from primary bidding goals. Keep QA out of customer reports.

## Revenue measurement

Report visits → unique saved inquiries → qualified roofing owners → held demos → activated trials → independent paying companies, collected cash, refunds and acquisition costs. GA4 alone does not verify qualification, demonstrations or payment. Use existing admin dispositions and Stripe records privately to reconcile the downstream stages; do not manufacture linkage or treat a trial as revenue. Keep all customer, account, analytics and revenue data out of this public repository.

## Search pilot

See `roofing-callback-search-pilot.json` for prepared keywords, exclusions, responsive ad copy, source tags, and activation checks. This is a prepared specification, not an existing Google Ads campaign. Keep the campaign paused until access, intake, conversion ingestion and a genuine $300 total campaign budget are verified. Configure a fixed 14-day interval at activation, in the account's timezone. Do not silently replace the total budget with an average daily budget. Existing campaigns for other businesses must remain untouched.

Official references: https://developers.google.com/analytics/devguides/collection/ga4/events and https://developers.google.com/google-ads/api/docs/campaigns/budgets/create-budgets .

## Verification

Local verification: 82 tests passed, production build passed, and the technical SEO audit passed all 24 sitemap URLs. Tests cover contact-only API validation, unchanged audit requirements, matching human-callback permission, one confirmed conversion, failed and ambiguous save responses, duplicate clicks, preserved campaign source, privacy, preview/QA exclusion and analytics failure isolation. Backend and mail-provider calls were mocked in tests. No test customer, production inquiry, notification email, AI call or payment was created by these tests. Live UI and delivery verification are separate release checks; GA4 ingestion and paid activation remain blocked until the required account connections succeed.
