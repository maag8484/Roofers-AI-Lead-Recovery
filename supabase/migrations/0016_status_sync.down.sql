-- ============================================================================
-- 0016 DOWN — revert the status sync.
-- Drops the trigger + mapping helper and restores the 0012 version of the RPC
-- (writes current_status only). Does NOT un-backfill `status` — that data is
-- now correct and reverting it would re-introduce the stale-badge bug.
-- ============================================================================

drop trigger if exists roofing_companies_sync_legacy_status on public.roofing_companies;
drop function if exists public.sync_legacy_status();

-- Restore the 0012 RPC body.
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
  v_from  public.customer_status_v2;
  v_admin uuid := auth.uid();
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select current_status into v_from
  from public.roofing_companies
  where id = p_customer_id
  for update;

  if v_from is null then
    raise exception 'Customer % not found', p_customer_id using errcode = 'P0002';
  end if;

  if v_from = p_to_status then
    raise exception 'Customer is already in status %', p_to_status using errcode = 'P0001';
  end if;

  update public.roofing_companies
  set current_status = p_to_status
  where id = p_customer_id;

  insert into public.customer_status_history
    (customer_id, from_status, to_status, changed_by_admin_id, note)
  values
    (p_customer_id, v_from, p_to_status, v_admin, p_note);

  insert into public.audit_logs
    (actor_id, entity_type, entity_id, field, old_value, new_value)
  values
    (v_admin, 'roofing_companies', p_customer_id::text, 'current_status',
     v_from::text, p_to_status::text);

  insert into public.activity_logs
    (customer_id, action, performed_by, result, status, metadata)
  values
    (p_customer_id, 'STATUS_CHANGED', v_admin, 'OK', 'OK',
     jsonb_build_object('from', v_from, 'to', p_to_status, 'note', p_note));
end;
$$;

drop function if exists public.customer_status_v2_to_legacy(public.customer_status_v2);

do $$
begin
  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'roofing_companies'
  ) then
    alter publication supabase_realtime drop table public.roofing_companies;
  end if;
end $$;
