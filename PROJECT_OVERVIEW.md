# Roof AI Lead Recovery — Project Overview & Status Report

**Product:** Roof AI Lead Recovery (roofaileadrecovery.com)
**Type:** SaaS web platform for roofing companies — recovers missed calls and auto-books estimates
**Pricing model:** $299/month · 7-day free trial · No setup fees · Cancel anytime
**Prepared for:** Client review
**Document version:** 1.0

---

## 1. Executive Summary

Roof AI Lead Recovery is a software platform that helps roofing companies stop losing
business to missed phone calls and slow follow-up. When a homeowner calls and no one picks
up — because the team is on a roof, driving, or it's after hours — the system instantly
responds, qualifies the lead, and books an inspection directly onto the company's calendar.

The platform is delivered as a complete web product with **three connected experiences**:

1. **The public website (marketing funnel)** — where roofing companies learn about the
   product and sign up.
2. **The customer portal** — where each roofing company onboards, connects their tools, and
   watches recovered leads and booked appointments arrive in real time.
3. **The admin portal** — an internal overview where the business owner can monitor every
   customer and all activity across the platform.

The actual AI conversation engine (call answering, text messaging, lead qualification) runs
on a dedicated automation backend that connects to this platform. This document focuses on
the **web platform** — the website, customer portal, and admin portal — which is what has
been built and what is presented here.

---

## 2. What the Platform Looks Like

### 2.1 The Public Website (Marketing Funnel)

A single, polished landing page designed to convert visiting roofing companies into trial
sign-ups. It is built around a clear, persuasive story and includes:

| Section | Purpose |
|---|---|
| **Hero** | Headline message — "Stop Losing Roofing Leads to Missed Calls & Slow Follow-Up" — with a clear call-to-action to start a free trial, plus an animated phone preview. |
| **The Problem** | Three cards walking through the painful reality: homeowner calls → no one answers → they call a competitor. |
| **How It Works** | A simple 3-step explanation: lead calls → AI responds instantly via text → inspection gets scheduled. |
| **Dashboard Preview** | A snapshot of the metrics customers will track (leads recovered, calls responded, estimates booked, response time). |
| **Pricing** | One transparent plan at $299/month with the full feature list and a 7-day free trial badge. |
| **The Math** | A persuasive cost breakdown showing that recovering even one roofing job pays for the platform many times over. |
| **FAQ** | Six common questions answered (how it works, setup time, after-hours behavior, cancellation, etc.). |
| **Final Call-to-Action** | A closing prompt to start the free trial. |

It also includes a **Privacy Policy** and **Terms of Service** page (legal templates),
plus a consistent top navigation bar and footer.

### 2.2 The Customer Portal

After a roofing company signs up, they enter a guided experience:

**A. Sign-Up Wizard (3 steps)**
- **Step 1 — Account:** company name, owner name, email, password, phone.
- **Step 2 — Business details:** business phone, service area, website, monthly lead volume.
- **Step 3 — Payment:** choose a trial option and check out securely.

**B. Setup Wizard (onboarding)**
- **Phone number setup:** the customer searches by area code and provisions a dedicated
  business phone number in a few clicks.
- **Calendar setup:** the customer connects their Google Calendar (one-click sign-in) and
  sets their availability and appointment length, so the AI only books open slots.

**C. The Live Dashboard** — the heart of the customer experience:
- A **welcome header** showing whether the account is "Live" or "Setup incomplete."
- A **setup checklist** that guides the customer through any remaining steps and a "Go Live"
  button once everything is connected.
- **Four key metrics** at a glance: Leads Recovered, Missed Calls Responded, Estimates
  Booked, and Average Response Time.
- An **Upcoming Appointments** list that updates **in real time** — the moment the AI books
  an appointment, it appears on the dashboard automatically with a notification, no refresh
  needed.
- A **side panel** with the business phone number (one-click copy), calendar connection
  status, and quick settings links.

### 2.3 The Admin Portal (Internal)

A private, read-only overview for the platform owner to monitor the whole business:

- **Top-level stats:** total customers, live accounts, active/trialing subscriptions, and
  recent appointment count.
- **Customers table:** every roofing company with their owner, phone number, calendar
  connection, plan status, live/setup status, and join date — with a **search box** to
  find any customer instantly.
- **Recent appointments table:** the latest appointments booked across all customers.
- A **refresh button** to pull the latest data on demand.

The admin view is **read-only by design** for safety — it shows everything but cannot alter
customer data.

---

## 3. Technology & Security (Plain-English)

| Area | What's used | Why it matters to you |
|---|---|---|
| **Website & portals** | Modern, fast web technology (React) | Quick, app-like experience on desktop and mobile. |
| **Backend & database** | Supabase (secure cloud database + login system) | Reliable, scalable, industry-standard. |
| **Payments** | Stripe Checkout | Trusted, PCI-compliant billing — card details never touch our servers. |
| **Phone numbers** | Twilio | Each customer gets a real, dedicated business number. |
| **Calendar** | Google Calendar (secure sign-in) | Appointments land directly on the customer's own calendar. |
| **Real-time updates** | Live data streaming | Appointments appear instantly, no page refresh. |
| **Security** | Per-customer data isolation | Each company can only ever see their own data; admin access is separate and read-only. |

**Data privacy:** every customer's information is strictly walled off from every other
customer at the database level. Sensitive credentials (calendar access tokens, etc.) are
encrypted, and payment processing is handled entirely by Stripe.

---

## 4. Scope of Work — Completed vs. Planned

The table below is the heart of this report: it shows clearly **what has been delivered**,
**what is in progress**, and **what is planned for future phases**.

### ✅ Phase 1 — COMPLETED (Delivered)

| # | Deliverable | Status |
|---|---|---|
| 1 | Full marketing website / landing page (hero, problem, how-it-works, pricing, math, FAQ, CTA) | ✅ Complete |
| 2 | Privacy Policy & Terms of Service pages | ✅ Complete (template copy) |
| 3 | Customer account sign-up (3-step wizard) | ✅ Complete |
| 4 | Secure login & authentication system | ✅ Complete |
| 5 | Stripe payment & subscription billing ($299/mo, 7-day trial) | ✅ Complete & connected |
| 6 | Business phone number provisioning (Twilio) | ✅ Complete |
| 7 | Google Calendar connection & availability setup | ✅ Complete |
| 8 | Customer dashboard with live metrics | ✅ Complete |
| 9 | Real-time appointment feed (instant updates) | ✅ Complete |
| 10 | Setup checklist & "Go Live" flow | ✅ Complete |
| 11 | Admin portal (customer overview + appointments + search) | ✅ Complete |
| 12 | Secure, per-customer data isolation | ✅ Complete |
| 13 | Connection points for the AI automation backend | ✅ Complete |

### 🔄 In Progress / Final Verification

| # | Item | Status |
|---|---|---|
| 14 | End-to-end payment test (live trial sign-up → confirmed subscription) | 🔄 Final testing |
| 15 | Production environment configuration & go-live checklist | 🔄 In progress |

### 🗓️ Phase 2 — PLANNED (Future Development)

| # | Planned feature | Notes |
|---|---|---|
| 1 | **Self-service billing portal** | Let customers update card, view invoices, and cancel from inside the dashboard. |
| 2 | **True "$1 for 7 days" trial option** | Currently the $1 option mirrors the free 7-day trial; add literal $1 collection. |
| 3 | **Onboarding & verification emails** | Welcome emails, email confirmation, and reminders. |
| 4 | **Finalized legal pages** | Replace template Privacy/Terms with attorney-reviewed copy. |
| 5 | **Expanded analytics & reporting** | Conversion trends, lead-source breakdowns, exportable reports. |
| 6 | **Performance optimizations** | Faster initial load via code-splitting. |
| 7 | **Customer notifications** | Optional SMS/email alerts to the roofing company on new bookings. |

> Phase 2 items are recommendations for ongoing development. Priorities and timelines can be
> adjusted to match your business goals.

---

## 5. Commercial Summary (Quotation)

> The figures below are **placeholders for your pricing** — please insert your agreed
> amounts. The structure separates what's been delivered from future work so the client sees
> clear value and a clean path forward.

### Phase 1 — Delivered (Website + Customer Portal + Admin Portal)

| Component | Description | Amount |
|---|---|---|
| Marketing website | Full landing page funnel + legal pages | _$____ |
| Customer portal | Sign-up, billing, onboarding wizard, live dashboard | _$____ |
| Admin portal | Customer & activity overview | _$____ |
| Integrations | Stripe billing, Twilio numbers, Google Calendar | _$____ |
| **Phase 1 Total** | **Complete platform as delivered** | **_$____** |

### Phase 2 — Future Development (Optional)

| Component | Description | Amount |
|---|---|---|
| Self-service billing portal | In-dashboard subscription management | _$____ |
| Email automation & verification | Onboarding + transactional emails | _$____ |
| Advanced analytics & reporting | Trends, exports, lead-source insights | _$____ |
| Legal finalization & polish | Attorney-reviewed pages, performance tuning | _$____ |
| **Phase 2 Total (est.)** | **Recommended next-phase scope** | **_$____** |

### Ongoing (Optional)

| Item | Description | Amount |
|---|---|---|
| Maintenance & support | Updates, monitoring, minor changes | _$____ / month |
| Hosting & third-party services | Supabase, Stripe, Twilio, Google (usage-based) | Pass-through / at cost |

---

## 6. Summary

**What's done:** A complete, working web platform — a professional marketing website, a
full customer portal with billing, onboarding, and a real-time dashboard, and an internal
admin portal — all securely connected to payment, phone, and calendar services and ready to
link with the AI automation engine.

**What's next:** A short final testing pass to confirm the live payment flow, followed by an
optional Phase 2 of enhancements (self-service billing, email automation, deeper analytics,
and legal finalization).

The platform is built on modern, scalable, industry-standard technology and is positioned to
grow with the business.

---

*This document describes the web platform (website, customer portal, admin portal). The AI
conversation engine that answers calls and sends texts runs on a connected automation backend
and is covered separately.*
