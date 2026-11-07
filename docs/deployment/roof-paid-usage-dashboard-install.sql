-- Dashboard install for Roof AI project vmafjqsthbrnjusowolj only.
-- Run on the existing Roof AI project. No customer rows, emails or charges are created.
BEGIN;
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

-- Only the trusted ingestion worker can call this after verifying a provider
-- event is a recovered call. Serialize per period so concurrent events cannot
-- miss the warning threshold. Provider replays never create two warning rows.
create function public.record_roof_recovery(p_period uuid, p_event text, p_at timestamptz)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  period public.roof_paid_periods%rowtype;
  counted integer;
begin
  select * into strict period from public.roof_paid_periods where id=p_period for update;
  if p_event is null or trim(p_event)='' or p_at is null or p_at < period.starts_at or p_at >= period.ends_at or p_at > now() then
    raise exception 'Invalid recovery receipt';
  end if;
  insert into public.roof_recovered_call_receipts(period_id,provider_event_id,occurred_at)
    values(p_period,p_event,p_at) on conflict do nothing;
  select count(*) into counted from public.roof_recovered_call_receipts where period_id=p_period;
  if counted >= 65 and counted < 75 and now() < period.ends_at
     and not exists (select from public.roof_call_pack_receipts where period_id=p_period) then
    insert into public.roof_usage_warning_outbox(period_id) values(p_period) on conflict do nothing;
  end if;
end;
$$;
revoke all on function public.record_roof_recovery(uuid,text,timestamptz) from public, anon, authenticated;
grant execute on function public.record_roof_recovery(uuid,text,timestamptz) to service_role;
COMMIT;
select to_regclass('public.roof_paid_periods') as paid_periods,
       to_regclass('public.roof_call_pack_receipts') as pack_receipts,
       to_regclass('public.roof_recovered_call_receipts') as call_receipts,
       to_regclass('public.roof_usage_warning_outbox') as warning_outbox,
       to_regprocedure('public.record_roof_recovery(uuid,text,timestamptz)') as record_recovery;
