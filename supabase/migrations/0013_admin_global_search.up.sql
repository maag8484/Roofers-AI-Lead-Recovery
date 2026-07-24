-- ============================================================================
-- 0013 UP — admin_global_search RPC (grouped cross-table search)
--
-- SECURITY DEFINER: runs as postgres and bypasses RLS, so the is_admin() guard
-- is the ONLY thing preventing a non-admin from calling this via rpc() and
-- reading cross-table data. The guard is therefore the FIRST executable
-- statement in the body — before any select runs (same shape as
-- admin_change_customer_status).
--
-- Returns grouped JSON: { customers:[...], notifications:[...],
-- activity:[...], audit:[...] }, up to p_limit hits per group. p_limit default
-- 5, capped at 20 server-side to prevent runaway queries (leaves room for a
-- future "See more" affordance without a new migration).
--
-- Run in the Supabase SQL editor. Idempotent (create or replace).
-- ============================================================================

create or replace function public.admin_global_search(
  p_query text,
  p_limit int default 5
)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_limit  int;
  v_like   text;
  v_result jsonb;
begin
  -- GUARD FIRST — before any table read.
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  -- Clamp the per-group limit to [1, 20]; default already 5 via signature.
  v_limit := least(greatest(coalesce(p_limit, 5), 1), 20);

  -- Empty query -> empty groups (the client shows "Recent" instead).
  if p_query is null or btrim(p_query) = '' then
    return jsonb_build_object(
      'customers', '[]'::jsonb,
      'notifications', '[]'::jsonb,
      'activity', '[]'::jsonb,
      'audit', '[]'::jsonb
    );
  end if;

  v_like := '%' || btrim(p_query) || '%';

  select jsonb_build_object(
    -- Customers: company / contact email / owner name / business phone.
    'customers', coalesce((
      select jsonb_agg(row_to_json(c))
      from (
        select rc.id, rc.company_name, rc.contact_email, rc.business_phone,
               rc.current_status, p.full_name as owner_name
        from public.roofing_companies rc
        left join public.profiles p on p.id = rc.user_id
        where rc.company_name ilike v_like
           or rc.contact_email ilike v_like
           or rc.business_phone ilike v_like
           or p.full_name ilike v_like
        order by rc.created_at desc
        limit v_limit
      ) c
    ), '[]'::jsonb),

    -- Notifications: title / body.
    'notifications', coalesce((
      select jsonb_agg(row_to_json(n))
      from (
        select id, type, title, body, severity, read_at, created_at
        from public.admin_notifications
        where title ilike v_like or body ilike v_like
        order by created_at desc
        limit v_limit
      ) n
    ), '[]'::jsonb),

    -- Activity logs: action / metadata-as-text.
    'activity', coalesce((
      select jsonb_agg(row_to_json(a))
      from (
        select id, customer_id, action, result, status, created_at
        from public.activity_logs
        where action ilike v_like
           or coalesce(metadata::text, '') ilike v_like
        order by created_at desc
        limit v_limit
      ) a
    ), '[]'::jsonb),

    -- Audit logs: entity_type / field / old_value / new_value.
    'audit', coalesce((
      select jsonb_agg(row_to_json(au))
      from (
        select id, entity_type, entity_id, field, old_value, new_value, created_at
        from public.audit_logs
        where entity_type ilike v_like
           or field ilike v_like
           or coalesce(old_value, '') ilike v_like
           or coalesce(new_value, '') ilike v_like
        order by created_at desc
        limit v_limit
      ) au
    ), '[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$$;

revoke all on function public.admin_global_search(text, int) from public;
grant execute on function public.admin_global_search(text, int) to authenticated;

-- ============================================================================
-- DONE. Test:
--   select public.admin_global_search('apex', 5);
-- ============================================================================
