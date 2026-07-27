-- ============================================================================
-- 0016 UP — Sync the two status columns (admin console <-> customer portal)
--
-- THE BUG: roofing_companies has TWO status columns (see CLAUDE.md):
--   * current_status (customer_status_v2, 13 values) — written by the admin
--     console via admin_change_customer_status().
--   * status         (text, 4 values: new/in_progress/live/paused) — READ by
--     the customer-facing dashboard + account page.
-- Nothing kept them in sync, so an admin changing status saw no effect at all
-- on the customer portal. Likewise the customer's own `status_history` table
-- (read by AccountPage) never received a row — the admin RPC only wrote to
-- customer_status_history.
--
-- THE FIX: one mapping function + an updated RPC that writes BOTH columns and
-- BOTH history tables in the same transaction. current_status stays the source
-- of truth; `status` becomes a derived mirror of it.
--
-- Run AFTER 0012 (and 0015) in the Supabase SQL editor.
-- SQL-editor gotcha: it runs the WHOLE tab — clear it (Ctrl+A -> Delete) first.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SECTION 1 — The canonical 13 -> 4 mapping.
-- Mirrors src/config/customerStatus.js: the NEW->LIVE progression collapses to
-- new / in_progress / live, and the terminal states collapse to paused (except
-- SUPPORT_REQUIRED, which is still an in-flight account).
-- ----------------------------------------------------------------------------
create or replace function public.customer_status_v2_to_legacy(
  p_status public.customer_status_v2
)
returns text
language sql
immutable
as $$
  select case p_status::text
    when 'NEW'                       then 'new'
    when 'WAITING_FOR_BUSINESS_INFO' then 'new'
    when 'BUSINESS_INFO_SUBMITTED'   then 'new'
    when 'SETUP_IN_PROGRESS'         then 'in_progress'
    when 'WAITING_FOR_CUSTOMER'      then 'in_progress'
    when 'PENDING_REVIEW'            then 'in_progress'
    when 'CONFIGURATION_COMPLETE'    then 'in_progress'
    when 'AI_ACTIVATED'              then 'live'
    when 'LIVE'                      then 'live'
    when 'PAUSED'                    then 'paused'
    when 'CANCELLED'                 then 'paused'
    when 'REJECTED'                  then 'paused'
    when 'SUPPORT_REQUIRED'          then 'in_progress'
    else 'new'
  end;
$$;

-- ----------------------------------------------------------------------------
-- SECTION 2 — Backfill: make `status` agree with current_status right now, so
-- existing customers stop showing a stale badge the moment this runs.
-- ----------------------------------------------------------------------------
update public.roofing_companies
set status = public.customer_status_v2_to_legacy(current_status)
where current_status is not null
  and status is distinct from public.customer_status_v2_to_legacy(current_status);

-- ----------------------------------------------------------------------------
-- SECTION 3 — The RPC, now writing BOTH columns and BOTH history tables.
-- Everything stays in the single implicit transaction of the function body:
-- all six writes commit together or roll back together.
-- ----------------------------------------------------------------------------
create or replace function public.admin_change_customer_status(
  p_customer_id uuid,
  p_to_status   public.customer_status_v2,
  p_note        text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from        public.customer_status_v2;
  v_user_id     uuid;
  v_from_legacy text;
  v_to_legacy   text := public.customer_status_v2_to_legacy(p_to_status);
  v_admin       uuid := auth.uid();
begin
  -- 1) Authorize. Non-admins get an exception, never a silent no-op.
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  -- Lock the row and read the current status + owner.
  select current_status, user_id, status
    into v_from, v_user_id, v_from_legacy
  from public.roofing_companies
  where id = p_customer_id
  for update;

  if not found then
    raise exception 'Customer % not found', p_customer_id using errcode = 'P0002';
  end if;

  -- 2) Reject a no-op transition BEFORE writing anything.
  if v_from = p_to_status then
    raise exception 'Customer is already in status %', p_to_status using errcode = 'P0001';
  end if;

  -- 3) The atomic unit: update BOTH status columns + 4 log rows.
  update public.roofing_companies
  set current_status = p_to_status,
      status         = v_to_legacy
  where id = p_customer_id;

  insert into public.customer_status_history
    (customer_id, from_status, to_status, changed_by_admin_id, note)
  values
    (p_customer_id, v_from, p_to_status, v_admin, p_note);

  -- Customer-visible history (AccountPage reads this one). Only write a row
  -- when the coarse legacy status actually changed, so the customer doesn't
  -- see "changed to in_progress" three times in a row for internal-only steps.
  if v_from_legacy is distinct from v_to_legacy then
    insert into public.status_history
      (company_id, user_id, from_status, to_status, changed_by, note)
    values
      (p_customer_id, v_user_id, v_from_legacy, v_to_legacy, v_admin, p_note);
  end if;

  insert into public.audit_logs
    (actor_id, entity_type, entity_id, field, old_value, new_value)
  values
    (v_admin, 'roofing_companies', p_customer_id::text, 'current_status',
     v_from::text, p_to_status::text);

  insert into public.activity_logs
    (customer_id, action, performed_by, result, status, metadata)
  values
    (p_customer_id, 'STATUS_CHANGED', v_admin, 'OK', 'OK',
     jsonb_build_object('from', v_from, 'to', p_to_status, 'note', p_note,
                        'legacy_from', v_from_legacy, 'legacy_to', v_to_legacy));
end;
$$;

revoke all on function public.admin_change_customer_status(uuid, public.customer_status_v2, text) from public;
grant execute on function public.admin_change_customer_status(uuid, public.customer_status_v2, text) to authenticated;

-- ----------------------------------------------------------------------------
-- SECTION 4 — Safety net: a trigger keeps `status` in step with current_status
-- even for direct SQL updates (n8n, manual fixes in the SQL editor) that don't
-- go through the RPC. Only fires when current_status actually changed, so a
-- plain `update ... set status = ...` is still respected.
-- ----------------------------------------------------------------------------
create or replace function public.sync_legacy_status()
returns trigger
language plpgsql
as $$
begin
  if new.current_status is not null
     and new.current_status is distinct from old.current_status then
    new.status := public.customer_status_v2_to_legacy(new.current_status);
  end if;
  return new;
end;
$$;

drop trigger if exists roofing_companies_sync_legacy_status on public.roofing_companies;
create trigger roofing_companies_sync_legacy_status
  before update on public.roofing_companies
  for each row
  execute function public.sync_legacy_status();

-- ----------------------------------------------------------------------------
-- SECTION 5 — Realtime so the customer portal updates without a manual reload.
-- Guarded: adding a table already in the publication raises otherwise.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'roofing_companies'
  ) then
    alter publication supabase_realtime add table public.roofing_companies;
  end if;
end $$;

-- ============================================================================
-- DONE. Verify:
--   select company_name, current_status, status from public.roofing_companies;
--   -- status must always be the legacy mapping of current_status.
--
--   select public.admin_change_customer_status('<real-uuid>', 'LIVE', 'test');
--   select current_status, status from roofing_companies where id = '<real-uuid>';
--   -- => ('LIVE', 'live')
-- ============================================================================
