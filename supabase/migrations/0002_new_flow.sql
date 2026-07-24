-- ============================================================================
-- Roof AI Lead Recovery — NEW FLOW (post-payment details form + status + audit)
-- Run AFTER 0000_full_setup.sql and 0001_admin.sql, in the Supabase SQL editor.
-- Idempotent: safe to re-run.
--
-- What this adds:
--   1. New business-detail columns on roofing_companies (collected by the
--      post-payment /onboarding form instead of at signup).
--   2. A `status` lifecycle column (new -> in_progress -> live -> paused) plus
--      `details_submitted` so the app knows when the onboarding form is done.
--   3. A `status_history` audit table — one row per status change, powering the
--      admin "Audit Log" tab.
--   4. A NARROW admin-write exception: admins may UPDATE roofing_companies.status
--      and INSERT status_history rows. Everything else stays admin-read-only,
--      per the read-only-admin invariant. This is the one deliberate exception
--      because the admin drives the status lifecycle from the portal.
--
-- SQL-editor gotcha: this editor runs the WHOLE tab. Clear it (Ctrl+A -> Delete)
-- before pasting so no stale SQL runs alongside this.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SECTION 1 — New columns on roofing_companies
-- ----------------------------------------------------------------------------
alter table public.roofing_companies
  add column if not exists address                text,
  add column if not exists service_areas          text,            -- counties or ZIPs, free text
  add column if not exists services                text,            -- e.g. "Roofing, Gutters"
  add column if not exists calendly_link           text,
  add column if not exists conversion_preference   text
    check (conversion_preference in ('scheduled_appointment','warm_transfer','take_message')),
  add column if not exists status                  text not null default 'new'
    check (status in ('new','in_progress','live','paused')),
  add column if not exists details_submitted       boolean not null default false;

-- ----------------------------------------------------------------------------
-- SECTION 2 — status_history (audit log)
-- One row per status transition. changed_by = the auth user who made the change
-- (an admin). from_status is null for the very first entry.
-- ----------------------------------------------------------------------------
create table if not exists public.status_history (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null,
  user_id      uuid not null,             -- the customer whose status changed
  from_status  text,
  to_status    text not null,
  changed_by   uuid,                      -- admin auth.uid() who made the change
  note         text,
  created_at   timestamptz not null default now()
);
create index if not exists status_history_company_id_idx on public.status_history(company_id);
create index if not exists status_history_created_at_idx  on public.status_history(created_at desc);

alter table public.status_history enable row level security;

-- ----------------------------------------------------------------------------
-- SECTION 3 — RLS for status_history
--   * Owner may read their own history.
--   * Admin may read all history AND insert (records each status change).
-- ----------------------------------------------------------------------------
drop policy if exists status_history_select_own on public.status_history;
create policy status_history_select_own on public.status_history
  for select using (auth.uid() = user_id);

drop policy if exists status_history_select_admin on public.status_history;
create policy status_history_select_admin on public.status_history
  for select using (public.is_admin());

drop policy if exists status_history_insert_admin on public.status_history;
create policy status_history_insert_admin on public.status_history
  for insert with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- SECTION 4 — Narrow admin UPDATE on roofing_companies (status control)
-- The existing owner "for all" policy already lets owners update their own row.
-- This ADDS an admin update policy. RLS is permissive, so admins can now update
-- any company row. We intentionally keep this the ONLY admin write surface;
-- admins have no insert/delete on app tables.
-- ----------------------------------------------------------------------------
drop policy if exists roofing_companies_update_admin on public.roofing_companies;
create policy roofing_companies_update_admin on public.roofing_companies
  for update using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- SECTION 5 — Foreign keys (guarded; give cascade + integrity)
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'auth' and table_name = 'users') then

    if not exists (select 1 from information_schema.table_constraints
                   where constraint_name = 'status_history_user_id_fkey') then
      alter table public.status_history
        add constraint status_history_user_id_fkey
        foreign key (user_id) references auth.users(id) on delete cascade;
    end if;

    if not exists (select 1 from information_schema.table_constraints
                   where constraint_name = 'status_history_company_id_fkey') then
      alter table public.status_history
        add constraint status_history_company_id_fkey
        foreign key (company_id) references public.roofing_companies(id) on delete cascade;
    end if;

  end if;
end $$;

-- ============================================================================
-- DONE. Verify:
--   select column_name from information_schema.columns
--   where table_name = 'roofing_companies' order by column_name;
--   -- should include: address, calendly_link, conversion_preference,
--   -- details_submitted, service_areas, services, status
-- ============================================================================
