-- ============================================================================
-- Roof AI Lead Recovery — COMPLETE database setup (single file)
--
-- HOW TO RUN: open the Supabase SQL editor, paste this whole file, click Run.
-- Idempotent: safe to re-run.
--
-- IMPORTANT DESIGN NOTE
-- Tables are created WITHOUT inline foreign keys to auth.users, so CREATE TABLE
-- can never fail on the FK target. The auth.users foreign keys are added at the
-- very end (Section 6) in a guarded block. RLS does NOT need the FK — it only
-- compares auth.uid() to the user_id / id column value.
--
-- Auth is 100% Supabase Auth. No users/password table.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- SECTION 1 — TABLES (no FK to auth.users; user_id / id are plain uuid)
-- ============================================================================

create table if not exists public.profiles (
  id          uuid primary key,
  full_name   text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.roofing_companies (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique,
  company_name          text not null,
  business_phone        text,
  website               text,
  service_area          text,
  monthly_leads_segment text check (monthly_leads_segment in ('under_10','10_25','25_50','50_plus')),
  setup_step            int not null default 1,   -- 1=account 2=payment 3=twilio 4=calendar 5=live
  is_live               boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null,
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  status                 text not null default 'incomplete',
  trial_ends_at          timestamptz,
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

create table if not exists public.twilio_accounts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique,
  phone_number  text not null,
  twilio_sid    text,
  friendly_name text,
  created_at    timestamptz not null default now()
);
create index if not exists twilio_accounts_user_id_idx on public.twilio_accounts(user_id);

create table if not exists public.calendar_connections (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique,
  provider       text not null default 'google',
  google_email   text,
  calendar_id    text,
  access_token   text,   -- encrypted by edge function
  refresh_token  text,   -- encrypted by edge function
  expires_at     timestamptz,
  connected_at   timestamptz not null default now()
);
create index if not exists calendar_connections_user_id_idx on public.calendar_connections(user_id);

create table if not exists public.availability_settings (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null unique,
  monday_start    time default '08:00', monday_end    time default '17:00',
  tuesday_start   time default '08:00', tuesday_end   time default '17:00',
  wednesday_start time default '08:00', wednesday_end time default '17:00',
  thursday_start  time default '08:00', thursday_end  time default '17:00',
  friday_start    time default '08:00', friday_end    time default '17:00',
  saturday_start  time, saturday_end  time,
  sunday_start    time, sunday_end    time,
  lunch_start                 time,
  lunch_end                   time,
  inspection_duration_minutes int not null default 60,
  timezone                    text not null default 'America/New_York',
  updated_at                  timestamptz not null default now()
);

create table if not exists public.appointments (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null,
  lead_name        text,
  lead_phone       text,
  lead_email       text,
  property_address text,
  service_type     text,
  scheduled_time   timestamptz,
  status           text not null default 'booked',
  source           text default 'missed_call',
  created_at       timestamptz not null default now()
);
create index if not exists appointments_user_id_time_idx
  on public.appointments(user_id, scheduled_time);

-- NOTE: named recovered_leads (NOT leads) to avoid colliding with the
-- existing Outscraper cold-outreach prospect table also named public.leads.
create table if not exists public.recovered_leads (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null,
  lead_phone        text,
  lead_name         text,
  status            text not null default 'responded',
  response_seconds  int,
  created_at        timestamptz not null default now()
);
create index if not exists recovered_leads_user_id_idx on public.recovered_leads(user_id);

-- ============================================================================
-- SECTION 2 — updated_at TRIGGERS
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.roofing_companies;
create trigger set_updated_at before update on public.roofing_companies
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.subscriptions;
create trigger set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.availability_settings;
create trigger set_updated_at before update on public.availability_settings
  for each row execute function public.set_updated_at();

-- ============================================================================
-- SECTION 3 — AUTH AUTOMATION
-- Mirror each new auth.users row into public.profiles.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- SECTION 4 — ROW LEVEL SECURITY (explicit policies)
-- ============================================================================
alter table public.profiles              enable row level security;
alter table public.roofing_companies     enable row level security;
alter table public.subscriptions         enable row level security;
alter table public.twilio_accounts       enable row level security;
alter table public.calendar_connections  enable row level security;
alter table public.availability_settings enable row level security;
alter table public.appointments          enable row level security;
alter table public.recovered_leads       enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (auth.uid() = id);

drop policy if exists roofing_companies_all_own on public.roofing_companies;
create policy roofing_companies_all_own on public.roofing_companies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists subscriptions_all_own on public.subscriptions;
create policy subscriptions_all_own on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists twilio_accounts_all_own on public.twilio_accounts;
create policy twilio_accounts_all_own on public.twilio_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists calendar_connections_all_own on public.calendar_connections;
create policy calendar_connections_all_own on public.calendar_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists availability_settings_all_own on public.availability_settings;
create policy availability_settings_all_own on public.availability_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists appointments_all_own on public.appointments;
create policy appointments_all_own on public.appointments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists recovered_leads_all_own on public.recovered_leads;
create policy recovered_leads_all_own on public.recovered_leads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- SECTION 5 — REALTIME
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'appointments'
  ) then
    alter publication supabase_realtime add table public.appointments;
  end if;
end $$;

-- ============================================================================
-- SECTION 6 — FOREIGN KEYS to auth.users (added last, guarded)
-- These give referential integrity + ON DELETE CASCADE. If for any reason
-- auth.users is unreachable in your context, this block is skipped without
-- failing the rest of the migration. RLS already works without these FKs.
-- ============================================================================
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'auth' and table_name = 'users') then

    if not exists (select 1 from information_schema.table_constraints
                   where constraint_name = 'profiles_id_fkey') then
      alter table public.profiles
        add constraint profiles_id_fkey
        foreign key (id) references auth.users(id) on delete cascade;
    end if;

    if not exists (select 1 from information_schema.table_constraints
                   where constraint_name = 'roofing_companies_user_id_fkey') then
      alter table public.roofing_companies
        add constraint roofing_companies_user_id_fkey
        foreign key (user_id) references auth.users(id) on delete cascade;
    end if;

    if not exists (select 1 from information_schema.table_constraints
                   where constraint_name = 'subscriptions_user_id_fkey') then
      alter table public.subscriptions
        add constraint subscriptions_user_id_fkey
        foreign key (user_id) references auth.users(id) on delete cascade;
    end if;

    if not exists (select 1 from information_schema.table_constraints
                   where constraint_name = 'twilio_accounts_user_id_fkey') then
      alter table public.twilio_accounts
        add constraint twilio_accounts_user_id_fkey
        foreign key (user_id) references auth.users(id) on delete cascade;
    end if;

    if not exists (select 1 from information_schema.table_constraints
                   where constraint_name = 'calendar_connections_user_id_fkey') then
      alter table public.calendar_connections
        add constraint calendar_connections_user_id_fkey
        foreign key (user_id) references auth.users(id) on delete cascade;
    end if;

    if not exists (select 1 from information_schema.table_constraints
                   where constraint_name = 'availability_settings_user_id_fkey') then
      alter table public.availability_settings
        add constraint availability_settings_user_id_fkey
        foreign key (user_id) references auth.users(id) on delete cascade;
    end if;

    if not exists (select 1 from information_schema.table_constraints
                   where constraint_name = 'appointments_user_id_fkey') then
      alter table public.appointments
        add constraint appointments_user_id_fkey
        foreign key (user_id) references auth.users(id) on delete cascade;
    end if;

    if not exists (select 1 from information_schema.table_constraints
                   where constraint_name = 'recovered_leads_user_id_fkey') then
      alter table public.recovered_leads
        add constraint recovered_leads_user_id_fkey
        foreign key (user_id) references auth.users(id) on delete cascade;
    end if;

  end if;
end $$;

-- ============================================================================
-- DONE. Verify (should return 8 rows):
--   select table_name from information_schema.tables
--   where table_schema = 'public' order by table_name;
-- ============================================================================
