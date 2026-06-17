-- ============================================================================
-- Roof AI Lead Recovery — ADMIN ROLE (read-only oversight)
-- Run AFTER 0000_full_setup.sql, in the Supabase SQL editor.
--
-- Adds a read-only admin role: admins can SELECT every customer's data across
-- all app tables, but cannot edit it (no insert/update/delete granted). Owner
-- policies from 0000 stay intact — admin policies are ADDED alongside them
-- (Postgres RLS is permissive: a row is visible if ANY select policy passes).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- admins : one row per admin user. Promote someone by inserting their user_id.
-- ----------------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- is_admin() : SECURITY DEFINER so it reads public.admins WITHOUT triggering
-- RLS. Calling it inside a policy therefore can't recurse. Returns true if the
-- current auth user is an admin.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ----------------------------------------------------------------------------
-- admins table RLS: an admin may read the admins list; nobody can self-grant
-- (writes happen via SQL / service_role only).
-- ----------------------------------------------------------------------------
alter table public.admins enable row level security;

drop policy if exists admins_select_admin on public.admins;
create policy admins_select_admin on public.admins
  for select using (public.is_admin());

-- ----------------------------------------------------------------------------
-- Admin read-all policies on every app table (SELECT only).
-- ----------------------------------------------------------------------------
drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles
  for select using (public.is_admin());

drop policy if exists roofing_companies_select_admin on public.roofing_companies;
create policy roofing_companies_select_admin on public.roofing_companies
  for select using (public.is_admin());

drop policy if exists subscriptions_select_admin on public.subscriptions;
create policy subscriptions_select_admin on public.subscriptions
  for select using (public.is_admin());

drop policy if exists twilio_accounts_select_admin on public.twilio_accounts;
create policy twilio_accounts_select_admin on public.twilio_accounts
  for select using (public.is_admin());

drop policy if exists calendar_connections_select_admin on public.calendar_connections;
create policy calendar_connections_select_admin on public.calendar_connections
  for select using (public.is_admin());

drop policy if exists availability_settings_select_admin on public.availability_settings;
create policy availability_settings_select_admin on public.availability_settings
  for select using (public.is_admin());

drop policy if exists appointments_select_admin on public.appointments;
create policy appointments_select_admin on public.appointments
  for select using (public.is_admin());

drop policy if exists recovered_leads_select_admin on public.recovered_leads;
create policy recovered_leads_select_admin on public.recovered_leads
  for select using (public.is_admin());

-- ============================================================================
-- PROMOTE THE FIRST ADMIN
-- Sign up in the app first, then run (replace the email):
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'test@growwstacks.com'
--   on conflict (user_id) do nothing;
--
-- Verify:  select * from public.admins;
-- ============================================================================
