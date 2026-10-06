# Roof AI proof-to-paid execution system

Prepared October 6, 2026. This is an operating specification, not customer proof.

## Commercial objective

Prove that Roof AI can repeatedly move a roofing company through:

1. a verified operating gap;
2. an authorized end-to-end workflow test;
3. a configured live trial;
4. a customer-verified outcome; and
5. an independently collected subscription payment.

The system is not proven by email volume, opens, demo views, friendly replies, requested
appointments, owner tests or a free trial alone.

## Active acquisition lanes

| Lane | Current asset | Owner | Success event |
| --- | --- | --- | --- |
| Buyer replies | Gmail and Instantly inboxes | Roof AI sales workflow | Agreed next step with date |
| Direct demand test | Sun Belt Overflow Owner Test, four vetted companies | Instantly | Qualified owner conversation |
| Human discovery | Jesse's four-week, 10-hours-per-week block | Jesse, with Cory coordinating | Confirmed gap and permitted next step |
| Partner distribution | Roofing agencies first; software platforms later | Roof AI sales workflow | One consenting client introduction |
| Conversion | Calculator, audit, demo and signup | Roof AI product workflow | Activated trial, then independent payment |

Do not create overlapping campaigns or let a partner, Jesse and Instantly approach the same
company simultaneously. Buyer replies always outrank new prospecting.

## Evidence grades

| Grade | Definition | Examples |
| --- | --- | --- |
| E1 | Provider-verified | Twilio call SID, notification ID, calendar ID, Stripe payment ID |
| E2 | Customer-verified | Held inspection, signed job or paid customer invoice with a source record |
| E3 | Conversation evidence | Exact buyer words, objection, permission and agreed next action |
| E4 | Estimate or model | Calculator scenario, projected value, self-reported volume |

E4 must never be presented as a verified result. A recorded demo proves only what the recording
shows. A provider event proves the event occurred, not that the buyer made money.

## Canonical event fields

Every material event should preserve:

- event_id, pilot_id, roofer_account_id
- UTC timestamp, local timestamp and timezone
- event type, provider and provider event ID
- privacy-safe lead key
- source channel, campaign or partner
- test flag and consent record
- call disposition, roofing need, service area and urgency
- qualification outcome and approved next action
- appointment ID, status and date
- owner-notification ID and delivery state
- customer job or invoice ID, amount and payment date when supplied
- Stripe customer, subscription, invoice and payment IDs
- refund amount
- evidence grade, evidence location, recorder and verifier

Use a keyed hash of normalized E.164 caller numbers in shared reports. Keep raw phone numbers,
recordings and customer records only in approved systems.

## Funnel and denominators

Report every conversion as a numerator and denominator:

- handled calls / offered calls
- completed qualifications / handled calls
- qualified opportunities / unique callers
- bookings / qualified opportunities
- held appointments / bookings
- signed jobs / held appointments
- paid customer invoices / signed jobs
- delivered owner notifications / required notifications
- activated trials / trial signups
- first paid subscriptions / activated trials
- second paid invoices / first paid subscriptions
- refunds / first paid subscriptions

Non-response, nonbounce, an open, a requested time and a forwarded survey are not conversions.

## Baseline and attribution

Before activation, capture seven comparable pre-pilot business days or four matching weekdays:
unanswered/busy/after-hours calls, returned calls, response time, qualified opportunities,
bookings and held appointments.

Attribute a customer job or invoice to an assisted caller only when:

1. the call was non-test and occurred during authorized coverage;
2. staff did not answer and Roof AI handled the call;
3. the normalized caller number exactly matches the customer's job or invoice record;
4. the roofer supplies the job or invoice ID; and
5. the invoice date is within 90 days of the call.

A different number requires written customer confirmation. Describe matching revenue as
“Roof AI-assisted,” not “caused by Roof AI.”

## Proof thresholds

### Technical proof

One authorized, labeled test completes:

missed call → approved response → qualification → callback or booking route → owner notification.

All provider IDs reconcile and no unsupported promise is made.

### Operational proof

- at least 20 real, non-test offered calls across at least two independent roofing companies;
- at least 95% of provider events reconcile;
- at least one qualified opportunity and delivered owner notification; and
- no unresolved consent, routing, retention or data-handling issue.

### Outcome proof

- at least one held appointment verified by the roofing company; and
- at least one signed job or paid customer invoice matched to the exact caller.

### Credible case study

- written publication permission;
- at least 30 days or 30 real calls;
- at least 95% event completeness;
- timeframe, sample size, exclusions and attribution method disclosed;
- at least one externally verified outcome; and
- failures and unmatched outcomes included.

Until these conditions are met, use “illustrative workflow” or “operational pilot,” not
“customer results.”

### Repeatable commercial proof

- three independent paying roofing companies;
- two reach a second paid Stripe invoice;
- at least one exact caller-to-paid-customer-invoice match; and
- one acquisition channel produces a second paid customer using the same process.

Report collected subscription revenue net of refunds and variable cost. Keep allocated software
costs separate.

## Four-week decision cadence

### Week 1 — instrument and qualify

- Verify the checkout, trial start, first charge date and activation path.
- Complete one controlled technical proof.
- Run the four-company Instantly test without adding volume.
- Require Jesse to record exact buyer words, current coverage, permission and next action.
- Repair or remove unsupported funnel claims before expanding traffic.

### Week 2 — activate qualified trials

- Prioritize confirmed gaps and requested follow-ups.
- Configure only supported routing, qualification and notification paths.
- Log provider IDs for every trial event.
- Ask agencies for one consenting roofing-client introduction; assume no commission,
  integration or exclusivity.

### Week 3 — verify external outcomes

- Reconcile callbacks, appointments and owner notifications.
- Ask the roofer to verify held appointments and any signed job or invoice IDs.
- Diagnose the largest funnel drop-off before changing audience, offer or volume.

### Week 4 — decide whether to scale

- Count independent payments, second invoices, refunds and variable costs.
- Publish a case study only if the evidence and permission thresholds are met.
- Scale only the channel that produced a verified paid customer through a repeatable path.
- If no paid result exists, change one constraint—segment, problem, proof or activation—not all
  four and not the daily cap.

## Daily decision rules

1. Buyer reply or paid obligation.
2. Agreed callback, demo or activation step.
3. Reconcile campaign sends, bounces, suppression and company-group collisions.
4. Execute only eligible new contact within the daily cap.
5. Record the exact outcome and next owner/date.
6. Stop immediately on decline, duplicate ownership, sender mismatch or unverified capability.

## Current checkpoint

- Instantly campaign 2906db77-6474-4718-a2ea-a5ba6c90b40b is active with four vetted
  Sun Belt prospects.
- First eligible send window begins October 7, 2026, 10:00 America/Chicago.
- No message had sent early and no buyer reply was waiting at the October 6 reconciliation.
- The live calculator audit CTA opens the on-page consent form. Do not misclassify it as broken.
- The current homepage still requires deployment of the proof-first copy before its absolute
  claims are considered corrected.
