# CLAUDE.md

Guidance for Claude Code when working in this repo.

## What this is

**Roof AI Lead Recovery** (roofaileadrecovery.com) — a $299/month SaaS that helps roofing
companies recover missed calls and auto-book estimates. This repo is the **frontend funnel +
onboarding wizard + dashboard + admin**, backed by Supabase.

**Critical division of responsibility:** the actual lead-recovery engine (call handling, IVR,
the AI agent conversation, lead qualification, SMS/email sending) lives in **n8n**, NOT in this
codebase. Do **not** build call/AI/SMS/booking-logic features here. This app only handles:
signup, Stripe billing, Twilio number provisioning, Google Calendar OAuth, a realtime customer
dashboard, and a read-only admin overview. n8n talks to this system via two edge functions
(`check-availability`, `book-appointment`) using an `X-Api-Key` shared secret.

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
    ui/              shadcn-style primitives (button, card, input, accordion, select, …)
    marketing/       Navbar, Footer, PhoneMockup, LegalLayout
    setup/           SetupLayout (wizard chrome)
    auth/            AuthLayout
    Logo, Stepper, ProtectedRoute (+ PublicOnlyRoute, AdminRoute)
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

## Conventions for edits

- Match the existing style: JSX, Tailwind utility classes, `cn()` from `@/lib/utils`, `@/`
  path alias for `src/`. Components are function components with named exports (UI primitives)
  or default exports (pages).
- Use the existing `ui/` primitives rather than adding a component library.
- Toasts via `sonner` (`import { toast } from "sonner"`).
- Keep marketing copy consistent with the landing page voice and the $299/month, 7-day-trial,
  "no sales call" positioning.

## Status / known gaps

- Billing portal page is a placeholder (the "Billing" link). Stripe billing-portal session not
  yet wired.
- "$1 for 7 days" trial currently maps to the same 7-day trial as the free option.
- Legal pages are templates pending real legal review.
- Single ~650 kB JS bundle (no code-splitting yet) — acceptable for MVP.
- `.env` wiring + an end-to-end manual run (signup → promote admin → admin view) is the
  natural next milestone.
