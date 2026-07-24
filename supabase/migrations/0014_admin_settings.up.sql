-- ============================================================================
-- 0014 UP — admin_settings (singleton, seeded), admin_notification_preferences,
-- and three admin-management RPCs (list / add / remove).
-- Idempotent. Run in the Supabase SQL editor AFTER 0013.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- admin_settings — singleton (id = 1). daily_send_cap is read by gmail-send.
-- SEEDED with defaults so the Settings page and the cap read never fall through
-- to the env fallback silently (which would mask a schema bug).
-- ----------------------------------------------------------------------------
create table if not exists public.admin_settings (
  id                     smallint primary key default 1,
  daily_send_cap         int not null default 500,
  health_check_hint      text default 'Every 5 minutes (external cron)',
  notification_recipient text,   -- null => fall back to the acting admin's email
  updated_at             timestamptz not null default now(),
  constraint admin_settings_singleton check (id = 1),
  constraint admin_settings_cap_nonneg check (daily_send_cap >= 0)
);

insert into public.admin_settings (id) values (1)
on conflict (id) do nothing;

drop trigger if exists set_updated_at on public.admin_settings;
create trigger set_updated_at before update on public.admin_settings
  for each row execute function public.set_updated_at();

alter table public.admin_settings enable row level security;

drop policy if exists admin_settings_select_admin on public.admin_settings;
create policy admin_settings_select_admin on public.admin_settings
  for select using (public.is_admin());

drop policy if exists admin_settings_update_admin on public.admin_settings;
create policy admin_settings_update_admin on public.admin_settings
  for update using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- admin_notification_preferences — one row per admin. Owner reads/writes own.
-- ----------------------------------------------------------------------------
create table if not exists public.admin_notification_preferences (
  admin_id             uuid primary key references public.admins(user_id) on delete cascade,
  on_gmail_disconnect  boolean not null default true,
  on_critical_error    boolean not null default true,
  on_new_signup        boolean not null default false,
  updated_at           timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.admin_notification_preferences;
create trigger set_updated_at before update on public.admin_notification_preferences
  for each row execute function public.set_updated_at();

alter table public.admin_notification_preferences enable row level security;

-- Admin may read/write their OWN preferences row.
drop policy if exists anp_select_own on public.admin_notification_preferences;
create policy anp_select_own on public.admin_notification_preferences
  for select using (public.is_admin() and admin_id = auth.uid());

drop policy if exists anp_upsert_own on public.admin_notification_preferences;
create policy anp_upsert_own on public.admin_notification_preferences
  for insert with check (public.is_admin() and admin_id = auth.uid());

drop policy if exists anp_update_own on public.admin_notification_preferences;
create policy anp_update_own on public.admin_notification_preferences
  for update using (public.is_admin() and admin_id = auth.uid())
  with check (public.is_admin() and admin_id = auth.uid());

-- ============================================================================
-- ADMIN MANAGEMENT RPCs — three separate SECURITY DEFINER functions, each with
-- is_admin() as the FIRST executable statement. auth email lives in auth.users
-- (not client-readable under RLS), so these definer functions are the only way
-- to list/resolve emails.
-- ============================================================================

-- 1) List admins WITH auth email + profile name.
create or replace function public.admin_list_admins()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(x) order by x.created_at)
    from (
      select a.user_id,
             u.email,
             p.full_name,
             a.created_at,
             u.last_sign_in_at
      from public.admins a
      left join auth.users u on u.id = a.user_id
      left join public.profiles p on p.id = a.user_id
    ) x
  ), '[]'::jsonb);
end;
$$;

-- 2) Add an admin by email. The target MUST already exist in auth.users
-- (elevate-existing; this does NOT invite/create users). Clear message if not.
create or replace function public.admin_add_admin(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_email is null or btrim(p_email) = '' then
    raise exception 'Email is required' using errcode = 'P0001';
  end if;

  select id into v_uid from auth.users where lower(email) = lower(btrim(p_email));
  if v_uid is null then
    raise exception 'No user with email % — they must sign up first', p_email
      using errcode = 'P0002';
  end if;

  insert into public.admins (user_id) values (v_uid)
  on conflict (user_id) do nothing;

  return jsonb_build_object('ok', true, 'user_id', v_uid);
end;
$$;

-- 3) Remove an admin. Guards: cannot remove yourself; cannot remove the last admin.
create or replace function public.admin_remove_admin(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'You cannot remove yourself' using errcode = 'P0001';
  end if;

  select count(*) into v_count from public.admins;
  if v_count <= 1 then
    raise exception 'Cannot remove the last admin' using errcode = 'P0001';
  end if;

  delete from public.admins where user_id = p_user_id;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.admin_list_admins() from public;
revoke all on function public.admin_add_admin(text) from public;
revoke all on function public.admin_remove_admin(uuid) from public;
grant execute on function public.admin_list_admins() to authenticated;
grant execute on function public.admin_add_admin(text) to authenticated;
grant execute on function public.admin_remove_admin(uuid) to authenticated;

-- ============================================================================
-- DONE. Verify:
--   select * from public.admin_settings;                    -- 1 row, cap 500
--   select public.admin_list_admins();
-- ============================================================================
