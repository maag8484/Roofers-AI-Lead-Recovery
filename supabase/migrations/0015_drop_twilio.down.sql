-- ============================================================================
-- 0015 DOWN — recreate public.twilio_accounts (schema only; DATA is not
-- recoverable). Restores the table exactly as defined in 0000 + 0001 (owner RLS)
-- + 0001_admin (admin read policy). Idempotent.
-- ============================================================================

create table if not exists public.twilio_accounts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique,
  phone_number  text not null,
  twilio_sid    text,
  friendly_name text,
  created_at    timestamptz not null default now()
);
create index if not exists twilio_accounts_user_id_idx on public.twilio_accounts(user_id);

alter table public.twilio_accounts enable row level security;

drop policy if exists twilio_accounts_all_own on public.twilio_accounts;
create policy twilio_accounts_all_own on public.twilio_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists twilio_accounts_select_admin on public.twilio_accounts;
create policy twilio_accounts_select_admin on public.twilio_accounts
  for select using (public.is_admin());

do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'auth' and table_name = 'users')
     and not exists (select 1 from information_schema.table_constraints
                     where constraint_name = 'twilio_accounts_user_id_fkey') then
    alter table public.twilio_accounts
      add constraint twilio_accounts_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;
