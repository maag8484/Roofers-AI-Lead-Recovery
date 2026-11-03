-- Service-owned receipts. No public client may supply usage or grant call credits.
create table public.roof_paid_periods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.roofing_companies(id),
  subscription_id text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  unique (company_id, starts_at),
  unique (subscription_id, starts_at)
);
create table public.roof_recovered_call_receipts (
  period_id uuid not null references public.roof_paid_periods(id),
  provider_event_id text not null,
  occurred_at timestamptz not null,
  primary key (period_id, provider_event_id)
);
create table public.roof_call_pack_receipts (
  stripe_session_id text primary key,
  payment_intent_id text not null unique,
  period_id uuid not null references public.roof_paid_periods(id),
  price_id text not null,
  calls integer not null,
  amount_cents integer not null,
  currency text not null check (currency='usd'),
  check ((price_id='price_1UXn65CB5wADtZS19CXdROLL' and calls=20 and amount_cents=5000)
      or (price_id='price_1UXn66CB5wADtZS12VbDpqYh' and calls=50 and amount_cents=10000))
);
create table public.roof_usage_warning_outbox (
  period_id uuid primary key references public.roof_paid_periods(id),
  created_at timestamptz not null default now(),
  delivery_state text not null default 'pending' check (delivery_state in ('pending','claimed','sent','suppressed')),
  provider_receipt text,
  check (delivery_state <> 'sent' or provider_receipt is not null)
);
alter table public.roof_paid_periods enable row level security;
alter table public.roof_recovered_call_receipts enable row level security;
alter table public.roof_call_pack_receipts enable row level security;
alter table public.roof_usage_warning_outbox enable row level security;
revoke all on public.roof_paid_periods, public.roof_recovered_call_receipts, public.roof_call_pack_receipts, public.roof_usage_warning_outbox from public, anon, authenticated;
grant select, insert, update on public.roof_paid_periods, public.roof_recovered_call_receipts, public.roof_call_pack_receipts, public.roof_usage_warning_outbox to service_role;
