# Optional AI demo request — review build

Prepared September 10, 2026. This branch adds **Request an AI demo call** to the existing Revenue Recovery Hub audit form. It captures a request for one AI voice sales demonstration. It does not place, schedule or approve calls, connect to Vapi/n8n, or remove suppression records.

## Visitor experience

- The choice starts unchecked and is separate from audit follow-up and marketing email preferences.
- The visible disclosure names Roof AI Lead Recovery, explains the AI-generated voice and sales-demo purpose, limits permission to one call, explains the typed-name electronic signature, and says consent is optional and not a condition of an audit or purchase.
- Selecting the option requires a phone number even if the visitor prefers email for the audit. A normalized number is displayed for confirmation. Supported input is a 10-digit North American number with an optional `+1`; extensions and other country-code formats are rejected. Formatting does not establish ownership or geographic eligibility.
- A successful request confirms receipt and says the team will review it and arrange the demo. It makes no immediate-call or response-time promise.
- If AI consent storage cannot be confirmed, the form retains the input and invites a retry. It does not substitute a prepared email for the AI permission record.

## Evidence and review

The existing `audit_requests` table gains `ai_demo_requested` (default false) and an atomic `ai_demo_consent` JSON record. Old requests have no AI permission. The API requires a literal boolean opt-in plus the current disclosure version; general contact and marketing consent cannot grant it.

| Evidence | Source |
| --- | --- |
| `version`, `text` | Canonical server disclosure matching the visible form |
| `phone_e164` | Validated, normalized submitted number |
| `signer_name` | Submitted full name, referenced in the disclosure |
| `signed_at` | Database transaction time, ignoring client timestamps |
| `scope` | `roof_ai_ai_voice_sales_demo` |
| `max_calls` | `1` |
| `method` | `checkbox_and_typed_name` |
| `submission_page` | Submitted page URL, bounded to 500 characters |

The evidence describes what was submitted; it is not identity verification. The database requires complete evidence and prevents later changes to the consent snapshot. Admins can read requests and update audit status; non-admins cannot read the table or invoke its service-only intake RPC. The migration adds the missing authenticated SELECT/status grants needed by the existing admin RLS policies.

The admin inbox flags requested demos and displays saved permission with **review required**. Internal audit alerts include the same indication. Before a call, an operator must review ownership and permission, match the exact number, check current suppression, calling eligibility and time zone, and obtain pilot approval. A new request must not clear a previous opt-out or turn an n8n candidate into `verified` automatically. Keep the one-call limit tied to the person/number, not merely to each form submission; retries may create more than one audit record.

The `ai_demo_requested` data-layer event fires only after confirmed API success. Existing audit events gain an `ai_demo_requested` boolean. No name, phone or email is added to the new event. GA4/GTM reporting configuration is not included in this branch.

Existing retention applies: audit records are removed after 18 months, spam after 30 days, and rate keys after 24 hours. Suppression remains in its separate store. Any later calling integration must preserve an appropriate evidence reference for the call; this branch does not change retention or downstream workflows.

The disclosure design follows the elements described in [47 CFR 64.1200(f)(9)](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200) and the [FCC's AI-voice ruling](https://docs.fcc.gov/public/attachments/FCC-24-17A1.pdf), checked September 10, 2026. Capturing the form is not a determination that any particular call is eligible.

## Validation completed

- `npm test`: 25 tests pass, including 13 new form/API consent tests and all existing audit/conversion tests.
- `npm run build`: passes. Vite still reports the existing large application chunk warning.
- Isolated PostgreSQL/WASM run: nine checks pass using the real 0020 and 0021 migration SQL. Checks cover old rows/clients, exact evidence and database time, invalid evidence rollback, immutable consent, admin access/status updates, non-admin/anonymous restrictions, rate limiting, and retention cleanup.
- `git diff --check` and JavaScript syntax checks pass.

No live form submission, notification, call, production migration or deployment was performed. The database checks use a local `auth.uid()` shim and the project's actual `is_admin()` implementation; production authentication and deployment still need their environment-specific smoke check.

To reproduce the optional database test without changing application dependencies, install `@electric-sql/pglite@0.5.8` into a temporary directory, then run:

```sh
node test/sql/ai-demo-consent.mjs /absolute/temp/path/node_modules/@electric-sql/pglite/dist/index.js
```

## Deployment order — approval required

1. Apply `supabase/migrations/0021_audit_ai_demo_consent.up.sql` to the intended Supabase environment after 0020. The migration is transactional. Do not rerun 0020 over it, since that would restore the old intake RPC.
2. Deploy this branch's frontend, API and admin changes together. Existing server environment variables are reused; no Vapi credential belongs in the public form.
3. In an approved test environment, submit a synthetic ordinary audit and a synthetic AI-demo request. Disable external email alerts for this smoke test. Verify consent evidence, admin visibility/status editing and non-admin denial. Do not dispatch a call from either test.
4. After production approval and deployment, verify one approved internal request and the new form event before using the intake for a prospect pilot. Production verification is still outstanding.

If the new API sees an old RPC that saved only the audit, it returns `AI_DEMO_CONSENT_NOT_SAVED`; the frontend also rejects a success response from an old API that does not acknowledge the demo. Migration-first deployment avoids this partial-save condition.

Rollback the application to the preceding version while retaining the additive columns and saved consent. The new RPC accepts old clients. Do not drop evidence or rerun a destructive down migration to roll back the UI.
