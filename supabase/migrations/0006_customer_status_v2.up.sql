-- ============================================================================
-- 0006 UP — customer_status_v2 enum + current_status/admin_notes/last_login_at
-- Additive only. Does NOT touch the existing text `status` column.
-- Idempotent. Run in the Supabase SQL editor.
-- ============================================================================

-- 13-value lifecycle enum (created only if absent).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'customer_status_v2') then
    create type public.customer_status_v2 as enum (
      'NEW',
      'WAITING_FOR_BUSINESS_INFO',
      'BUSINESS_INFO_SUBMITTED',
      'SETUP_IN_PROGRESS',
      'WAITING_FOR_CUSTOMER',
      'PENDING_REVIEW',
      'CONFIGURATION_COMPLETE',
      'AI_ACTIVATED',
      'LIVE',
      'PAUSED',
      'CANCELLED',
      'SUPPORT_REQUIRED',
      'REJECTED'
    );
  end if;
end $$;

-- New columns (nullable first so backfill can run).
alter table public.roofing_companies
  add column if not exists current_status public.customer_status_v2,
  add column if not exists admin_notes    text,
  add column if not exists last_login_at  timestamptz;

-- Backfill current_status from the existing text status via explicit CASE.
-- Only fills rows where current_status is still null (safe to re-run).
update public.roofing_companies
set current_status = case status
  when 'new'         then 'NEW'::public.customer_status_v2
  when 'in_progress' then 'SETUP_IN_PROGRESS'::public.customer_status_v2
  when 'live'        then 'LIVE'::public.customer_status_v2
  when 'paused'      then 'PAUSED'::public.customer_status_v2
  else 'NEW'::public.customer_status_v2
end
where current_status is null;

-- Now lock in not-null + default.
alter table public.roofing_companies
  alter column current_status set default 'NEW'::public.customer_status_v2;

alter table public.roofing_companies
  alter column current_status set not null;

-- ============================================================================
-- DONE.
-- ============================================================================
