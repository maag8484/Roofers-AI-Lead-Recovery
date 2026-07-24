-- ============================================================================
-- CREATE TWO USERS — one admin, one customer
-- Run in the Supabase SQL editor AFTER WIPE_USERS.sql, 0000, 0001, and 0002.
--
-- ⚠️ EDIT THE 4 VALUES BELOW before running (emails + passwords).
--
-- What this does:
--   * Inserts two rows into auth.users with bcrypt-hashed passwords
--     (crypt(... gen_salt('bf')) — the format Supabase Auth expects).
--   * Marks both emails confirmed so they can sign in immediately.
--   * Inserts the matching auth.identities row (required for email/password
--     login to resolve the user).
--   * Promotes the admin via public.admins.
--   * The on_auth_user_created trigger (from 0000) auto-creates public.profiles.
--
-- NOTE: Direct inserts into auth.users are discouraged by Supabase. This works
-- on current Postgres/GoTrue schemas; if a future Supabase version changes the
-- auth schema and login fails, delete these two users and re-create them via
-- Dashboard -> Authentication -> Add User instead.
--
-- SQL-editor gotcha: this editor runs the WHOLE tab. Clear it (Ctrl+A -> Delete)
-- before pasting so no stale SQL runs alongside this.
-- ============================================================================

create extension if not exists "pgcrypto";

do $$
declare
  -- >>> EDIT THESE <<<
  admin_email    text := 'divyanshu.sharma@growwstacks.com';
  admin_password text := 'Divyanshu@2026';
  cust_email     text := 'divyanshutest2@gmail.com';
  cust_password  text := 'Divyanshu@2026';
  -- <<< EDIT THESE >>>

  admin_id uuid := gen_random_uuid();
  cust_id  uuid := gen_random_uuid();
begin
  -- ---- ADMIN USER --------------------------------------------------------
  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated', admin_email,
    crypt(admin_password, gen_salt('bf')), now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('full_name', 'Admin'),
    now(), now()
  );

  insert into auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    admin_id, admin_id,
    jsonb_build_object('sub', admin_id::text, 'email', admin_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  -- Promote to admin (read + narrow status-write, per 0002).
  insert into public.admins (user_id) values (admin_id)
    on conflict (user_id) do nothing;

  -- ---- CUSTOMER USER -----------------------------------------------------
  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000', cust_id, 'authenticated', 'authenticated', cust_email,
    crypt(cust_password, gen_salt('bf')), now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('full_name', 'Customer'),
    now(), now()
  );

  insert into auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    cust_id, cust_id,
    jsonb_build_object('sub', cust_id::text, 'email', cust_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  raise notice 'Admin user id: %', admin_id;
  raise notice 'Customer user id: %', cust_id;
end $$;

-- ---- VERIFY ----------------------------------------------------------------
-- select u.email, (a.user_id is not null) as is_admin
-- from auth.users u
-- left join public.admins a on a.user_id = u.id
-- order by u.created_at;
--
-- The customer has NO roofing_companies row yet — that's expected. It's created
-- when they log in, pay, and submit the /onboarding form. To let the customer
-- reach the dashboard WITHOUT going through Stripe while testing, you can fake a
-- subscription + company row — ask and I'll give you that seed SQL.
-- ============================================================================
