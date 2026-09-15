# Requested signup handoff — rollout candidate, September 14, 2026

Status: database deployed and verified; Vercel PR preview reports Ready. Production activation and the internal end-to-end test remain pending. No prospect calls or emails were sent by this change.

Access checkpoint: both integrations are installed/enabled, but no callable Vercel API tools are exposed in this workspace. The CLI device-login attempt was blocked by workspace network policy at `https://api.vercel.com:443`; no CLI login was saved. Repeating account sign-in does not resolve that policy block. Continue through working connected Vercel tools or an execution environment authorized to reach that API. Never disable preview protection or send credentials through chat.

## Verified live commercial path

Use https://www.roofaileadrecovery.com/signup. Account creation leads to `/checkout`, which calls the existing authenticated `stripe-create-checkout` function. The live Roof AI Stripe account has active monthly USD price `price_1TxyreCB5wADtZS1PSFxHja4` ($299). A historical completed checkout using the site's onboarding success URL had that price and an exactly seven-day subscription trial. This is historical integration evidence, not a new end-to-end transaction or a new customer.

The standalone Stripe payment link inspected September 14 has no trial. Do not use it for this offer. Existing checkout enables automatic tax; this change does not alter tax settings, registration, billing or cancellation behavior.

## Architecture and trust boundary

Existing published n8n receiver `LiX3fL9oyBip8x0E` continues to retrieve authoritative Vapi calls, process opt-outs, verify caller details and suppress blocked contacts. Add a separate branch only after those checks have completed successfully. Do not replace the working receiver with an older exported workflow.

The branch calls `POST /api/vapi-followup` with a server-side bearer credential. The endpoint independently fetches the finalized Vapi call. Production calls must include `metadata.audit_request_id`, recorded one-call AI-demo permission predating the call, and matching dialed, consent and audit phone numbers. The email must match the audit email. A correction to a different address requires manual review; do not guess or modify the audit silently.

The actual transcript must contain an explicit signup-link email question naming the address, immediately followed by a short affirmative answer. Opt-outs and later substantive corrections hold the request. The conservative parser can hold legitimate requests; it never treats model extraction flags as permission.

The authenticated n8n branch must freshly check the phone suppression table `McdKeXN4QpXiWYEf`, workspace email suppression/bounce/unsubscribe records, and consent revocations. The current reviewer does NOT yet produce all these checks; this is a deployment dependency, not an existing integration. Do not hardcode clear flags. Failures, missing records required for a check, ambiguous replies and stale data must stop the send. The endpoint also checks SendGrid global, bounce, spam and invalid-email suppression lists and its SQL suppression table.

Request contract (values are runtime evidence, never fixed booleans):

```json
{
  "source_call_id": "<authoritative finalized call UUID>",
  "suppression_check": {
    "source_call_id": "<same UUID>",
    "email": "<verified audit email, lowercase>",
    "phone_e164": "<verified call number>",
    "checked_at": "<time all suppression/revocation checks finished>",
    "phone_clear": true,
    "email_clear": true,
    "revocation_clear": true
  }
}
```

The check must be less than 30 seconds old at claim time. This is a trusted service attestation, not a public client input. Keep the token only in an n8n credential and server environment; never in the prompt, browser or exported workflow. Disable retry on the HTTP send node. A repeated completed call cannot cause another automatic provider POST because the database has a unique call claim. There is a small unavoidable interval between checking suppression and provider submission; keep checks immediately adjacent to submission and stop pending work upon revocation.

Provider 202 means accepted, not delivered. Timeouts, 5xx, process crashes and post-send database failures retain the claim and require provider reconciliation. Never delete a claim or automatically resend. The signed `/api/vapi-email-events` endpoint records actual delivery and suppression events idempotently. It preserves delivery events that arrive before the dispatch response. Delivery does not establish signup, paid status or completed activation.

## Deployment configuration

1. Database checkpoint: project `vmafjqsthbrnjusowolj` received the exact `0022_vapi_signup_delivery.sql` as migration `20260914192258_vapi_signup_delivery`. Permissions, replay protection and event ordering were verified live; temporary test writes were rolled back. Do not reapply this migration or run historical migrations in bulk: project migration history was previously empty. The companion `vapi_preserve_audit_cleanup` migration allows audit retention cleanup while preserving the deduplication claim. Verify its migration-history entry before any application.
2. Deploy this branch with `VAPI_FOLLOWUP_MODE=off` initially. Required server variables: existing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SENDGRID_API_KEY`; new `VAPI_PRIVATE_API_KEY`, `VAPI_FOLLOWUP_TOKEN` (random >=32 characters), `VAPI_FOLLOWUP_FROM` (verified sender). Optional `SENDGRID_API_BASE_URL` is exactly the US or EU origin. The API key must permit mail send and all four suppression lookups; a failed lookup blocks sending.
3. Configure a signed SendGrid Event Webhook to `https://www.roofaileadrecovery.com/api/vapi-email-events` for delivered, bounce, dropped, spam report and unsubscribe events. Preserve other existing account webhooks. Put its base64 DER public verification key in `SENDGRID_EVENT_PUBLIC_KEY`. Confirm raw request bodies reach the function unchanged.
4. Implement the n8n branch described above with fresh workspace email and revocation checks. Preserve opt-out processing even if the email branch fails. A handoff error should create an internal review record, not trigger redial or email retry.
5. Set mode `test` and `VAPI_FOLLOWUP_TEST_TO` to Cory's explicitly confirmed inbox. Only internal assistant `ef0931f3-859d-48ff-9a1e-205c5afbbddf` is accepted. Do not remove Cory's existing phone suppression. Use an internal web/simulation call with genuine spoken approval for the test inbox and no customer dialing; all applicable suppression checks still apply.
6. Run the internal script below; verify one delivered email in the inbox AND signed event ledger, replay the completion twice, verify only one provider POST, and follow signup through checkout to confirm the displayed seven-day/$299 offer. Do not create a paid subscription merely to test the link.
7. After evidence passes, apply the prompt addition to the production assistant, ensure future approved calls carry audit metadata, set mode `live` only in Vercel production, and admit one eligible opted-in prospect. Leave batch cold calling disabled.

Vercel project settings: https://vercel.com/roof-ai-lead-recovery/roofers-ai-lead-recovery/settings/environment-variables. Confirm project ID `prj_2CY5raQNIZ9FZ8yQQyaIAbbs6DHD` and team `team_WVLU1KlTTe2JoW2OrqAQIXaC` before changing configuration. Add new secrets through encrypted/sensitive server variables, not frontend `VITE_` variables. Keep mode `off` until credentials, suppression checks and signed event handling are configured. Limit initial `test` mode to the internal recipient, redeploy after environment changes, and verify via the protected preview with authenticated tooling. A Ready build alone is not a passing delivery test.

Rollback: set `VAPI_FOLLOWUP_MODE=off`, disable only the new n8n send branch, and restore the saved prior assistant prompt. Preserve opt-out receiver, delivery ledger and signed event processing for outstanding mail.

## Assistant prompt addition — candidate, not applied

Preserve the current AI disclosure, one-question cadence, pricing, no-pressure behavior, opt-out handling and two-rejected-confirmation stop rule. Replace the deferred-demo close with the following only after the handoff test passes:

> After a useful short demo, ask whether they want the seven-day trial signup link. If they do, verify the email one field at a time. Ask exactly: “May I email the signup link to [verified email address]?” Use the full address, with spoken at and dot if helpful. Wait for a clear yes. If unclear, correct or clarify once; after a second rejected confirmation stop collection. Never infer permission from silence or a request for information alone. On acceptance, say: “Thanks. I have your request for the signup link. The plan is $299 per month plus applicable tax after the seven-day trial unless you cancel. You'll review the terms at checkout.” Do not claim the email has been sent, delivery succeeded, an appointment is booked, or service is active. Do not ask another collection question after the final email permission. Respect any later correction or opt-out and stop follow-up.

Internal cases: exact yes; different email; uncertain response; corrected address; opt-out before or after yes; suppressed phone; suppressed email; missing audit consent; replay; provider timeout; invalid event signature; delayed event; account creation and checkout; forwarding/intake activation check. Parser ambiguity should produce review, never a message.

## Sales cadence and scorecard

Owner: Cory. Initial goal: first three activated trials, a planning target rather than a forecast. The current queue has zero eligible external AI-demo requests. Acquire permission first.

- Daily: select named roofing owners within the existing aggregate 10-email/day guardrail and suppression rules. Offer a brief missed-call demonstration and a clear opt-in route. Do not increase volume until the observed bounce issue is reviewed.
- For an eligible requested call: confirm permission, ask how missed calls are handled, demonstrate one realistic roofing inquiry, explain the $299/seven-day offer, request permission to send the signup link, and stop after the authorized call. No automatic redial.
- Review each business day: qualified prospects contacted, replies, explicit AI-call permissions, calls completed, signup links requested, messages accepted, messages delivered, accounts created, trials started, and trials activated. Keep internal records excluded and avoid double-counting repeated sends.
- Diagnose the first failing stage: no replies means revisit targeting/offer/deliverability; calls without requests means revisit demo and close; delivered links without signup means inspect signup friction; trials without activation means personally resolve forwarding/intake setup.
- Only individually requested follow-up is included here. Additional marketing sequences require their own consent/suppression review; this endpoint sends one requested link only.

## Sources

- [Vapi server events](https://docs.vapi.ai/server-url/events)
- [SendGrid signed webhook and raw-byte verification](https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features)
- [SendGrid mail submission](https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send)
- [SendGrid global suppression lookup](https://www.twilio.com/docs/sendgrid/api-reference/suppressions-global-suppressions/retrieve-a-global-suppression)
