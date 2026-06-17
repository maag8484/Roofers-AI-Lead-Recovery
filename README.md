# Roof AI Lead Recovery

Frontend + setup wizard for **roofaileadrecovery.com** — a $299/month SaaS that helps
roofing companies recover missed calls and auto-book estimates. The lead-recovery engine
itself (call handling, AI agent, SMS/email) runs in **n8n**; this app is the sales funnel,
onboarding wizard, and real-time dashboard, backed by Supabase.

## Stack

- **Frontend:** React 18 + Vite 6, Tailwind CSS, shadcn/ui-style components, React Router 7
- **Forms/State:** React Hook Form, React Context
- **Backend:** Supabase (Postgres + Auth + Realtime + Edge Functions)
- **Payments:** Stripe Checkout
- **Telephony:** Twilio (number provisioning)
- **Calendar:** Google Calendar OAuth
- **Hosting:** Vercel (frontend) + Supabase (backend)

## Project layout

```
src/
  components/      ui/ (shadcn primitives), marketing/, setup/, auth/, ProtectedRoute, Stepper, Logo
  context/         AuthContext.jsx        # Supabase auth + profile
  lib/             supabase.js, utils.js
  pages/           LandingPage, LoginPage, SignupPage, DashboardPage,
                   setup/TwilioSetupPage, setup/CalendarSetupPage, legal/*
supabase/
  migrations/      0000_full_setup.sql   # one file: tables + RLS + triggers + realtime
  functions/       stripe-create-checkout, stripe-webhook,
                   twilio-search-numbers, twilio-purchase-number,
                   google-oauth-start, google-oauth-callback,
                   check-availability, book-appointment, _shared/
  config.toml      # marks external-facing functions as verify_jwt = false
```

## 1. Local setup

```bash
npm install
cp .env.example .env      # fill in VITE_PUBLIC_* values
npm run dev               # http://localhost:5173
```

## 2. Database

Open the Supabase SQL editor, paste the **entire** contents of
`supabase/migrations/0000_full_setup.sql` (select all with Ctrl+A so the whole file runs,
not just a highlighted part), and click **Run**. It's one file, idempotent, and runs in the
correct order — tables → triggers → RLS → realtime.

Verify it worked:
```sql
select table_name from information_schema.tables
where table_schema = 'public' order by table_name;
-- expect 8: appointments, availability_settings, calendar_connections, leads,
--           profiles, roofing_companies, subscriptions, twilio_accounts
```

Auth is 100% Supabase Auth — no users/password table. The `handle_new_user` trigger
auto-creates a `profiles` row whenever a user signs up, and the `appointments` table is
added to the `supabase_realtime` publication so the dashboard updates live.

## 3. Edge function secrets

Set these with the CLI (never put service-role/secret keys in the frontend `.env`):

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_... \
  STRIPE_PRICE_ID=price_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  TWILIO_ACCOUNT_SID=AC... \
  TWILIO_AUTH_TOKEN=... \
  GOOGLE_CLIENT_ID=....apps.googleusercontent.com \
  GOOGLE_CLIENT_SECRET=... \
  GOOGLE_REDIRECT_URI=https://<ref>.supabase.co/functions/v1/google-oauth-callback \
  TOKEN_ENCRYPTION_KEY=$(openssl rand -base64 32) \
  N8N_VOICE_WEBHOOK_URL=https://your-n8n/webhook/voice \
  N8N_SHARED_SECRET=$(openssl rand -hex 32)
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically — don't set them.

## 4. Deploy edge functions

```bash
supabase functions deploy stripe-create-checkout
supabase functions deploy twilio-search-numbers
supabase functions deploy twilio-purchase-number
supabase functions deploy google-oauth-start

# External callers can't send a Supabase JWT — disable verification:
supabase functions deploy stripe-webhook          --no-verify-jwt
supabase functions deploy google-oauth-callback   --no-verify-jwt
supabase functions deploy check-availability       --no-verify-jwt
supabase functions deploy book-appointment         --no-verify-jwt
```

(`config.toml` already records the `verify_jwt = false` flags for the second group.)

## 5. Third-party config

- **Stripe:** create a $299/month recurring Price → `STRIPE_PRICE_ID`. Add a webhook
  endpoint to `…/functions/v1/stripe-webhook` for `customer.subscription.*` events.
- **Google Cloud:** OAuth web client. Authorized redirect URI must exactly match
  `GOOGLE_REDIRECT_URI` above. Enable the Google Calendar API.
- **Twilio:** a parent account with billing; the functions buy sub-numbers and point
  their Voice webhook at `N8N_VOICE_WEBHOOK_URL`.

## 6. Frontend deploy (Vercel)

```bash
npm run build      # outputs dist/
vercel deploy
```

Set the `VITE_PUBLIC_*` env vars in the Vercel dashboard. (SPA routing: Vercel serves
`index.html` for unknown paths by default with the Vite preset.)

## n8n ⇄ app contract

n8n owns all call/AI/SMS logic and talks to two endpoints using the `N8N_SHARED_SECRET`
as an `X-Api-Key` header:

**Check availability**
```
POST /functions/v1/check-availability     (X-Api-Key: <secret>)
{ "user_id": "...", "daysAhead": 5 }
→ { "slots": [{ "start": "Tuesday 2:00 PM", "dateTime": "2026-..." }] }
```

**Book appointment**
```
POST /functions/v1/book-appointment        (X-Api-Key: <secret>)
{ "user_id":"...", "lead_name":"...", "lead_phone":"...", "lead_email":"...",
  "property_address":"...", "service_type":"storm_damage", "selected_slot":"2026-..." }
→ { "success": true, "appointment_id": "...", "google_event_id": "..." }
```

`book-appointment` writes to `appointments`, which streams to the dashboard via Supabase
Realtime — no extra notification call needed.

## What this app does NOT do

Call handling, IVR, the AI conversation, lead qualification, and SMS/email confirmations
all live in n8n. This app only handles sign-up, billing, number provisioning, calendar
connection, and the dashboard.

## Status / next steps

- [ ] Billing settings page (currently the "Billing" link is a placeholder → wire a Stripe
      billing-portal session)
- [ ] "$1 for 7 days" trial currently maps to the same 7-day trial as the free option;
      add a one-time setup fee in Stripe if you want literal $1 collection
- [ ] Email verification / onboarding emails (Supabase Auth templates)
- [ ] Code-split the bundle (single ~640 kB chunk today)
