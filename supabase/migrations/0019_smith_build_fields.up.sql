-- ============================================================================
-- Roof AI Lead Recovery — 0019: Smith.ai build-request fields
-- Run in the Supabase SQL editor (clear the tab first — Ctrl+A -> Delete).
-- Idempotent.
--
-- WHY:
--   The "New Onboarding Call for Roof AI Lead Recovery" email that gets sent to
--   the Smith.ai build team requires 10 specific details. The /onboarding form
--   already collected 6 of them (company name, owner name, owner number, owner
--   email, business hours, business number). This migration adds columns for
--   the remaining 4 so the whole build packet is captured in-app instead of
--   being chased over email:
--
--     7.  Phone Provider              -> phone_provider (+ phone_provider_other)
--     8.  Employee Names              -> employees (jsonb array)
--     9.  Employee Transfer Lines     -> employees[].transfer_line
--     10. Employee and Summary Emails -> employees[].email + summary_emails
--
-- SHAPE of `employees` — one object per directory entry, so items 8/9/10 stay
-- correlated rather than living in three parallel free-text blobs:
--   [{ "name": "Jane Doe", "transfer_line": "+15551234567", "email": "jane@co.com" }, ...]
-- Defaults to an empty array so existing rows and any code doing
-- `(employees ?? [])` behave identically.
--
-- `summary_emails` is a text[] — the addresses that receive the daily/summary
-- call recap (often the owner + office manager), which is distinct from the
-- per-employee routing emails above.
-- ============================================================================

alter table public.roofing_companies
  add column if not exists phone_provider        text,          -- e.g. 'RingCentral', 'AT&T', 'Other'
  add column if not exists phone_provider_other  text,          -- free text when phone_provider = 'Other'
  add column if not exists employees             jsonb   not null default '[]'::jsonb,
  add column if not exists summary_emails        text[]  not null default '{}'::text[];

-- Guard the jsonb shape: must be an array (never an object/scalar), so consumers
-- (the admin console, the n8n build-email workflow) can iterate it safely.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.roofing_companies'::regclass
      and conname  = 'roofing_companies_employees_is_array'
  ) then
    alter table public.roofing_companies
      add constraint roofing_companies_employees_is_array
      check (jsonb_typeof(employees) = 'array');
  end if;
end $$;

comment on column public.roofing_companies.phone_provider is
  'Business phone carrier/VoIP provider. Smith.ai needs this to set up call forwarding.';
comment on column public.roofing_companies.phone_provider_other is
  'Free-text provider name, only used when phone_provider = ''Other''.';
comment on column public.roofing_companies.employees is
  'Employee directory: [{name, transfer_line, email}]. Drives the AI receptionist''s transfer directory.';
comment on column public.roofing_companies.summary_emails is
  'Addresses that receive call summary emails (separate from per-employee routing emails).';

-- ============================================================================
-- DONE. Verify:
--   select column_name, data_type from information_schema.columns
--   where table_name = 'roofing_companies'
--     and column_name in ('phone_provider','phone_provider_other','employees','summary_emails');
-- ============================================================================
