# CLAUDE.md

Guidance for Claude Code when working in this repo.

## What this is

**Roof AI Lead Recovery** (roofaileadrecovery.com) — a $299/month SaaS that helps roofing
companies recover missed calls and auto-book estimates. This repo is the **frontend funnel +
onboarding wizard + dashboard + admin**, backed by Supabase.

**Critical division of responsibility:** the actual lead-recovery engine (call handling, IVR,
the AI agent conversation, lead qualification, SMS/email sending) lives in **n8n**, NOT in this
codebase. Do **not** build call/AI/SMS/booking-logic features here. This app handles: signup,
Stripe billing, a realtime customer dashboard, and a **full admin operations console** (see the
"Admin console" section below — customers, onboarding pipeline, billing/numbers views,
activity/audit logs, notifications, global search, and an admin-connected Gmail send pipe).
Twilio provisioning and Google Calendar are now team/n8n-driven, not customer self-serve. n8n
talks to this system via edge functions (`check-availability`, `book-appointment`).

## Stack

- React 18 + Vite 6, Tailwind CSS, hand-written shadcn/ui-style primitives (in
  `src/components/ui/`, **JSX not TSX** — this is a JavaScript project, no TypeScript)
- React Router 7, React Hook Form, `sonner` for toasts, Zustand available (not heavily used)
- Supabase: Postgres + Auth + Realtime + Edge Functions (Deno)
- Stripe (Checkout), Twilio (number provisioning), Google Calendar (OAuth)
- Brand color `#2563eb` (`brand-600`). Font: Inter.

## Commands

```bash
npm install
npm run dev      # localhost:5173 (or next free port)
npm run build    # production build to dist/  — run this to verify changes compile
npm run lint
```

There is no test suite. **Verify changes by running `npm run build`** (it type-checks imports
and JSX). The dev server is the way to manually verify UI.

## Project layout

```
src/
  components/
    ui/              shadcn-style primitives (button, card, input, select, phone-field, …)
    marketing/       Navbar, Footer, PhoneMockup, LegalLayout
    onboarding/      WelcomeHero, OnboardingModal (customer first-run tour)
    admin/           layout/, settings/, panels/ + StatCard/StatusBadge/SideDrawer/… (console)
    auth/            AuthLayout
    Logo, AccountMenu, ProtectedRoute (+ PublicOnlyRoute, AdminRoute)
  hooks/admin/       one hook per admin data concern (list/detail/logs/settings/…)
  config/            customerStatus.js (13-value enum meta), plan.js (PLAN_LABEL)
  context/AuthContext.jsx   # Supabase auth + profile + isAdmin
  lib/supabase.js, utils.js
  pages/
    LandingPage, LoginPage, SignupPage (4-step wizard), DashboardPage,
    AdminDashboardPage, setup/TwilioSetupPage, setup/CalendarSetupPage,
    legal/PrivacyPage, legal/TermsPage, NotFoundPage
  App.jsx            # all routes
supabase/
  migrations/        0000_full_setup.sql (tables/RLS/triggers/realtime), 0001_admin.sql
  functions/         edge functions (Deno/TS) + _shared/
  config.toml        # verify_jwt=false flags for external-facing functions
```

## Database — IMPORTANT conventions

The user runs **all SQL manually** in the Supabase SQL editor and **deploys edge functions
manually** via the CLI. Do NOT use the Supabase MCP to apply migrations or create projects —
write SQL/functions as files and hand them over.

- Auth is **100% Supabase Auth** (`auth.users`). There is no custom users/password table.
  A `handle_new_user` trigger auto-creates a `public.profiles` row on signup from the
  `signUp({ options: { data } })` metadata (full_name, phone).
- Tables: `profiles` (keyed by `id` = the user id), and `user_id`-keyed `roofing_companies`,
  `subscriptions`, `twilio_accounts`, `calendar_connections`, `availability_settings`,
  `appointments`, `recovered_leads`.
- **`recovered_leads`, NOT `leads`.** A pre-existing `public.leads` table holds Outscraper
  cold-outreach scrape data owned by n8n — the app must NEVER read, alter, or drop it. The
  app's homeowner-callback table is deliberately named `recovered_leads` to avoid the
  collision. `create table if not exists public.leads` silently no-ops against the scrape
  table and breaks everything — never do it.
- **RLS everywhere**, owner-only (`auth.uid() = user_id`). The `service_role` key (edge
  functions, Stripe webhook, n8n) bypasses RLS.
- **Admin** = a row in `public.admins`. `is_admin()` is a `SECURITY DEFINER` function (so it
  doesn't recurse through RLS); admin SELECT policies are added *alongside* owner policies
  (RLS is permissive). Admin is **read-only** — no insert/update/delete granted. Promote via
  SQL: `insert into public.admins (user_id) select id from auth.users where email = '…'`.
- Realtime: `appointments` is in the `supabase_realtime` publication; the dashboard subscribes
  to INSERTs filtered by `user_id`.
- SQL editor gotcha: it runs the **entire tab**, so stale leftover SQL causes confusing
  "relation/column does not exist" errors. When handing the user SQL, tell them to clear the
  editor (Ctrl+A → Delete) before each paste, or run in a fresh query tab.

## Edge functions (Deno, in supabase/functions/)

- User-invoked (keep JWT verification ON): `stripe-create-checkout`, `twilio-search-numbers`,
  `twilio-purchase-number`, `google-oauth-start`.
- External-invoked (deploy `--no-verify-jwt`, already flagged in `config.toml`):
  `stripe-webhook`, `google-oauth-callback`, `check-availability`, `book-appointment`.
- `_shared/supabase.ts` has `serviceClient()`, `getUser(req)`, and AES-GCM `encrypt/decrypt`
  for Google tokens (key = `TOKEN_ENCRYPTION_KEY`, 32-byte base64).
- Secrets are set via `supabase secrets set …`, never in the frontend `.env`. Only
  `VITE_PUBLIC_*` vars reach the browser.

## Env

Copy `.env.example` to `.env`. Browser needs `VITE_PUBLIC_SUPABASE_URL`,
`VITE_PUBLIC_SUPABASE_ANON_KEY`, `VITE_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
`VITE_PUBLIC_GOOGLE_CLIENT_ID`. `.env` is gitignored — never commit secrets.

## Auth flow (email confirmation is ON)

- Supabase "Confirm email" is **enabled**, so `signUp()` returns a user but **no session** until
  the user clicks the email link. Signup therefore CANNOT write to the DB at signup time.
- Workaround: the signup wizard stashes all company details in the `signUp` **metadata**. On the
  first authenticated load, `AuthContext.ensureCompany()` materializes the `roofing_companies`
  row from that metadata. Don't re-add a pre-confirmation DB write to the wizard.
- Gotcha: Supabase rejects clearly-fake emails (`@example.com`) with `email_address_invalid` —
  test with a real domain. The built-in email service caps confirmation/reset sends (~3/hour);
  `over_email_send_rate_limit` is a rate limit, not a bug. Configure custom SMTP for production.
- Password reset: `resetPassword()` emails a link to `/reset-password`
  ([ResetPasswordPage.jsx](src/pages/ResetPasswordPage.jsx)), which listens for the
  `PASSWORD_RECOVERY` event and calls `updateUser({ password })`. `/reset-password` is an
  unguarded public route (the recovery token creates a session).

## New flow (signup → pay → details form → team takeover)

The onboarding order was inverted. Business details are now collected **after
payment**, not at signup:

1. **Signup** ([SignupPage.jsx](src/pages/SignupPage.jsx)) is **email + password only**.
   Email confirmation is expected **OFF** in Supabase so `signUp()` returns a live session
   immediately → redirect to `/checkout`. (If confirmation is re-enabled, signup shows a
   toast telling the user to confirm; the seamless flow needs it off.)
2. **Welcome + payment** ([CheckoutPage.jsx](src/pages/CheckoutPage.jsx)) is a premium
   first-run experience, NOT a bare checkout: a full-page `WelcomeHero` with an auto-opening
   5-step `OnboardingModal` (Welcome → Features → What you'll need → Pricing → Next steps).
   The final CTA "Start Free Trial" starts Stripe Checkout with `success_url = /onboarding`;
   the `stripe-webhook` flips the subscription to active/trialing. Onboarding components live
   in [src/components/onboarding/](src/components/onboarding/) (Framer Motion animations).
   First-run auto-show is gated by `profiles.onboarding_completed` (added in
   `0004_onboarding_flag.sql`); `AuthContext` exposes `onboardingCompleted` +
   `markOnboardingComplete()`. The modal is replayable from the dashboard header
   (Help → **Product tour**) and from CheckoutPage's own **Product tour** button /
   `?tour=1`.
3. **Details form** ([OnboardingPage.jsx](src/pages/OnboardingPage.jsx)) is grouped into four
   sections: **Business Information** (name, address, business phone → forwards to Smith.ai,
   primary contact name + email), **Service Details** (service area, services offered — both
   free-text), **Call Handling** (conversion goal radio with a CONDITIONAL input: Calendly
   link for scheduled_appointment / transfer number for warm_transfer / nothing for
   take_message), and **Hours of Operation** (business hours, after-hours preference). It
   **upserts** the `roofing_companies` row (keyed by `user_id`), sets `details_submitted =
   true` and `status = 'new'`, then goes to `/dashboard`. New columns are added in
   `0003_form_fields.sql` (contact_name, contact_email, transfer_number, business_hours,
   after_hours_preference).
4. **Gate:** [DashboardPage.jsx](src/pages/DashboardPage.jsx) redirects non-admins with no
   active/trialing sub to `/checkout`, and paid-but-`!details_submitted` to `/onboarding`.
5. The `roofing_companies` row is **no longer created from signup metadata** — `ensureCompany`
   was removed from [AuthContext.jsx](src/context/AuthContext.jsx). The onboarding upsert is
   the only creation path now.

### Customer no longer self-serves Twilio/Calendar

The customer-facing "Purchase Twilio number" and "Connect Google Calendar" steps were
**removed from all customer UI** (dashboard, checklist, setup cards). The `/setup/twilio` and
`/setup/calendar` routes and their pages (`TwilioSetupPage`, `CalendarSetupPage`,
`components/setup/SetupLayout`) were **deleted**. Provisioning is handled by the team/n8n; the
customer just sees status (`new → in_progress → live`). The `twilio_accounts` /
`calendar_connections` tables and edge functions are **KEPT** — the admin panel's Google
reconnect (agency model) and n8n still use them. Dashboard setup card is now
`OnboardingChecklist` (Account → Subscription → Business info → Team configuring → AI activated).

### Account Overview + international phone

- [AccountPage.jsx](src/pages/AccountPage.jsx) (`/account`) — single place for account info,
  onboarding progress %, subscription, business details, support, recent activity (from
  `status_history`). Linked from the dashboard header + "Manage" card.
- Business phone uses [phone-field.jsx](src/components/ui/phone-field.jsx)
  (`react-phone-number-input`): flag + searchable country + dial code + auto-format. Stored as
  **E.164** in `business_phone`, with the ISO country in `phone_country` (added in
  `0005_phone_and_tour.sql`). Validated with the library's `isValidPhoneNumber`.
- Product tour buttons are gated on `profiles.onboarding_completed` — hidden once completed,
  everywhere.

### Status lifecycle + audit (admin drives it)

- `roofing_companies.status`: `new → in_progress → live → paused`. The admin changes it from
  the portal. `0002_new_flow.sql` adds a **narrow admin UPDATE policy** on
  `roofing_companies` (the ONE deliberate exception to read-only-admin) plus INSERT on
  `status_history`. Everything else stays admin-read-only.
- `status_history` (new table) records every change; powers the admin **Audit Log** tab.
- [AdminDashboardPage.jsx](src/pages/AdminDashboardPage.jsx) is now tabbed: **Overview**
  (table + inline status dropdown + Google reconnect), **Audit** (one customer's full
  submitted details), **Audit Log** (status-change timeline).

### Admin Google reconnect (agency model)

The admin connects Google Calendar **on the customer's behalf**. `google-oauth-start` accepts
`target_user_id`; if present and ≠ caller, it verifies the caller is an admin (`isAdminUser`
in `_shared/supabase.ts`) and stores the connection against that customer's `user_id`. The
callback needed no change (it already writes to `state.uid`). **Redeploy both is not needed —
only `google-oauth-start` changed** (plus `_shared`, which it bundles).

## Conventions for edits

- Match the existing style: JSX, Tailwind utility classes, `cn()` from `@/lib/utils`, `@/`
  path alias for `src/`. Components are function components with named exports (UI primitives)
  or default exports (pages).
- Use the existing `ui/` primitives rather than adding a component library.
- Toasts via `sonner` (`import { toast } from "sonner"`).
- Keep marketing copy consistent with the landing page voice and the $299/month, 7-day-trial,
  "no sales call" positioning.

## Admin console (operations dashboard)

The old single-file admin (`AdminDashboardPage.jsx`, tabbed Overview/Audit/Audit-Log) was
rebuilt into a full operations console. The legacy page is preserved at **`/admin/legacy`**
(untouched, still reachable). Everything below sits inside `AdminRoute` + a persistent
`AdminShell` layout (sidebar + topbar).

- **Shell:** [components/admin/layout/](src/components/admin/layout/) — `AdminShell`
  (`<Outlet/>` layout route), `Sidebar` (permanent ≥lg, drawer <lg, `ADMIN_NAV` is the single
  nav source), `Topbar` (page title, global search trigger, notification bell, account menu).
  `GmailWarningBanner` renders above the topbar on every admin page when Gmail ≠ CONNECTED.
- **Pages** (`src/pages/admin/`, routes under `/admin/*`): `Dashboard` (KPI cards +
  EmailHealthCard + 4 recent panels), `Customers` (server-paginated list) + `customers/:id`
  detail (timeline, autosave notes, status history/logs), `Onboarding` (kanban + stalled),
  `IntegrationsEmail`, `business-numbers`, `Billing`, `Activity`, `Audit`, `Notifications`,
  `Settings` (3 tabs: Gmail / Admin Users / Notification Prefs).
- **Data access:** direct Supabase queries via hooks in [src/hooks/admin/](src/hooks/admin/),
  one per concern, `{ data, loading, error }`. **Server-side** pagination/sort/filter
  (`.range()/.order()/.ilike()/.in()`) — no client-side filtering of lists. Auth-gating is
  RLS: admins have SELECT-all + narrow writes; non-admins get zero rows (the "403").
- **Shared admin primitives:** `StatCard`, `StatusBadge` (13-value), `OnboardingProgress`,
  `SideDrawer`, `SeverityBadge`, `ListControls` (chips + pagination), `panels/PanelShell`.
  Status metadata lives in [src/config/customerStatus.js](src/config/customerStatus.js);
  the single plan label in [src/config/plan.js](src/config/plan.js).

### Customer status: two parallel columns (IMPORTANT)

`roofing_companies` now has **two** status columns:
- `status` (text: `new/in_progress/live/paused`) — the ORIGINAL, still read by customer-facing
  pages (dashboard, account). **Not removed.**
- `current_status` (`customer_status_v2` enum, 13 values) — the ADMIN console's lifecycle,
  backfilled from `status` in `0006`. The admin console reads/writes this one.

**All admin status changes go through the `admin_change_customer_status` RPC (0012)** — one
atomic transaction that updates `current_status` + inserts `customer_status_history` + `audit_logs`
+ `activity_logs`. Never do split client writes for status. The RPC is `SECURITY DEFINER` with
`is_admin()` as its first statement.

### Admin observability tables (migrations 0006–0014)

`customer_status_history`, `admin_notifications`, `activity_logs`, `audit_logs`,
`email_integration_status` (Gmail singleton), `admin_settings` (singleton),
`admin_notification_preferences`. All RLS admin-only; log/token writes come from service-role
edge functions (bypass RLS). Canonical `activity_logs.action` strings: `STATUS_CHANGED`,
`VIEWED_CUSTOMER`, `EMAIL_SENT`, `EMAIL_SEND_FAILED`, `EMAIL_SEND_RATE_LIMITED`,
`GMAIL_CONNECTED/RECONNECTED/OAUTH_CALLBACK_REJECTED`.

### Gmail send integration (separate from Calendar OAuth)

A **workspace-level Gmail** account (one, admin-connected) is the health-monitored email pipe.
Scope `gmail.send`, reuses `GOOGLE_CLIENT_ID/SECRET`, new `GMAIL_REDIRECT_URI`. Edge functions:
`gmail-oauth-start` (JWT on, admin-gated, HMAC-signed state), `gmail-oauth-callback`
(JWT off, verifies state before code exchange), `gmail-send` (JWT on, cap from
`admin_settings.daily_send_cap` → env `DAILY_SEND_CAP` → 500, fail-closed on 0), and
`gmail-health-check` (JWT off, refresh-probe → `NEEDS_REAUTH` + CRITICAL notification).
State signing is in `_shared/oauthState.ts` (`OAUTH_STATE_SECRET`, falls back to
`TOKEN_ENCRYPTION_KEY`); Gmail helpers in `_shared/gmail.ts`. Tokens stored **encrypted** in
`email_integration_status` (the `token_encryption_iv` column is inert — `encrypt()` prepends
the IV to the ciphertext).

**No custom customer email exists in this repo** — all transactional email is n8n's. `gmail-send`
is production-shaped and health-monitored, but the actual sends are theoretical until an n8n
workflow calls it. [src/lib/emailSites.js](src/lib/emailSites.js) is the copyable feature-flagged
pattern for adding real send sites; the one example (`STATUS_LIVE`,
`VITE_USE_GMAIL_SEND_FOR_STATUS_LIVE`) defaults **OFF** (flag-off = pure no-op). The Email &
Integrations page's `SendSiteIndicator` shows each site's on/off path.

### Calendar removed from customer UI (tables kept)

Per the rebuild, the customer-facing Google **Calendar** connect/reconnect UI was removed. The
`calendar_connections` / `appointments` / `availability_settings` tables and the
`google-oauth-*` / `check-availability` / `book-appointment` edge functions are **KEPT** (dormant)
so n8n and data aren't broken. The admin "Google" column is now reserved/neutral.

## Status / known gaps

- Billing portal page is a placeholder (the "Billing" link). Stripe billing-portal session not
  yet wired.
- "$1 for 7 days" trial currently maps to the same 7-day trial as the free option.
- Legal pages are templates pending real legal review.
- Single ~650 kB JS bundle (no code-splitting yet) — acceptable for MVP.
- `.env` wiring + an end-to-end manual run (signup → promote admin → admin view) is the
  natural next milestone.

### New-flow setup steps the USER must do manually (in order)
1. Run `supabase/migrations/WIPE_USERS.sql` (clears all users; does NOT touch `public.leads`).
2. Run `supabase/migrations/0002_new_flow.sql` (new columns, `status_history`, admin policies).
2b. Run `supabase/migrations/0003_form_fields.sql` (expanded onboarding form columns).
2c. Run `supabase/migrations/0004_onboarding_flag.sql` (profiles.onboarding_completed flag).
2d. Run `supabase/migrations/0005_phone_and_tour.sql` (roofing_companies.phone_country).
3. Supabase → Authentication → Providers/Email → **turn OFF "Confirm email"** (enables the
   instant signup→pay→form flow).
4. Redeploy the edge function: `supabase functions deploy google-oauth-start` (admin-on-behalf
   Google reconnect). It bundles the updated `_shared/supabase.ts`.
5. Create the two users via the app signup, then promote the admin via SQL (see 0001_admin.sql).

### Admin-console setup steps the USER must do manually (Phases 1–7)
6. Run migrations **0006 → 0014 in order** in the SQL editor (up-files):
   `0006_customer_status_v2` (enum + `current_status` backfill), `0007_customer_status_history`,
   `0008_email_integration_status`, `0009_admin_notifications`, `0010_activity_logs`,
   `0011_audit_logs`, `0012_admin_change_customer_status` (RPC), `0013_admin_global_search` (RPC),
   `0014_admin_settings` (settings + prefs + 3 admin RPCs; seeds the `admin_settings` singleton).
   Each has a matching `.down.sql` for rollback (run in reverse order).
7. **Gmail integration** (only if using the email pipe): in Google Cloud enable the Gmail API,
   add the `gmail.send` scope to the consent screen, and register a new redirect URI for
   `gmail-oauth-callback`. Set secrets: `GMAIL_REDIRECT_URI`, `GMAIL_FROM`, `DAILY_SEND_CAP`,
   optional `OAUTH_STATE_SECRET`. Deploy `gmail-oauth-start gmail-send`, and
   `gmail-oauth-callback` + `gmail-health-check` (the last two are `verify_jwt=false` in
   `config.toml`). Point a cron at `gmail-health-check` per its `CRON.md`.
8. Feature flags default **OFF**: `VITE_USE_GMAIL_SEND_FOR_STATUS_LIVE` (browser). Flip in
   production one at a time after verifying in dev.
