-- ============================================================================
-- 0012 UP — admin_change_customer_status RPC (atomic status transition)
--
-- ATOMICITY: A PL/pgSQL function runs inside a single implicit transaction.
-- All four writes below (UPDATE current_status + 3 INSERTs) either ALL commit
-- or ALL roll back together. If any insert raises, the current_status update is
-- rolled back too. We deliberately do NOT wrap them in an explicit
-- begin...commit block — that is unnecessary (and misleading) inside a function;
-- the function body is already the transaction boundary.
--
-- GUARD ORDER (important):
--   1. is_admin() check      -> raises BEFORE any read/write if caller isn't admin
--   2. same-status check     -> raises BEFORE any write if from == to
--   3. update + 3 inserts    -> the atomic unit
--
-- Admin id = auth.uid() (in this repo admins.user_id IS the auth user id).
-- SECURITY DEFINER so the function can write the admin-only log tables; the
-- is_admin() guard is what actually authorizes the caller.
--
-- Run in the Supabase SQL editor. Idempotent (create or replace).
-- ============================================================================

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
  -- 1) Authorize. Non-admins get an exception, never a silent no-op.
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  -- Lock the row and read the current status.
  select current_status into v_from
  from public.roofing_companies
  where id = p_customer_id
  for update;

  if v_from is null then
    raise exception 'Customer % not found', p_customer_id using errcode = 'P0002';
  end if;

  -- 2) Reject a no-op transition BEFORE writing anything.
  if v_from = p_to_status then
    raise exception 'Customer is already in status %', p_to_status using errcode = 'P0001';
  end if;

  -- 3) The atomic unit: update + history + audit + activity.
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

-- Only authenticated users may call it; the is_admin() guard does the real
-- authorization inside the body.
revoke all on function public.admin_change_customer_status(uuid, public.customer_status_v2, text) from public;
grant execute on function public.admin_change_customer_status(uuid, public.customer_status_v2, text) to authenticated;

-- ============================================================================
-- DONE. Bad-path test (run twice; 2nd call must raise, history must have 1 row):
--   select public.admin_change_customer_status('<real-uuid>', 'LIVE', 'test');
--   select public.admin_change_customer_status('<real-uuid>', 'LIVE', 'test');  -- raises P0001
--   select count(*) from customer_status_history where customer_id = '<real-uuid>' and to_status='LIVE';
-- ============================================================================
