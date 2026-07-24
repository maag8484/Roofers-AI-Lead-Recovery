-- ============================================================================
-- 0008 UP — email_integration_status (singleton Gmail-send health/token row)
-- Tokens are stored ENCRYPTED using the same AES-GCM + TOKEN_ENCRYPTION_KEY
-- pattern as calendar tokens (see supabase/functions/_shared/supabase.ts);
-- the edge function writes ciphertext here, never plaintext.
-- Singleton enforced via a fixed primary key. RLS: admin-only.
-- Idempotent.
-- ============================================================================

create table if not exists public.email_integration_status (
  id                        smallint primary key default 1,
  provider                  text not null default 'GMAIL',
  status                    text not null default 'DISCONNECTED',
  connected_at              timestamptz,
  oauth_expires_at          timestamptz,
  last_successful_email_at  timestamptz,
  last_failed_email_at      timestamptz,
  last_error                text,
  last_health_check_at      timestamptz,
  emails_sent_today         int not null default 0,
  encrypted_access_token    text,   -- AES-GCM ciphertext (base64)
  encrypted_refresh_token   text,   -- AES-GCM ciphertext (base64)
  token_encryption_iv       text,   -- base64 IV, if stored separately from ct
  updated_at                timestamptz not null default now(),
  constraint email_integration_singleton check (id = 1),
  constraint email_integration_provider_chk check (provider in ('GMAIL')),
  constraint email_integration_status_chk
    check (status in ('CONNECTED','DISCONNECTED','EXPIRED','NEEDS_REAUTH'))
);

-- Seed exactly one row, DISCONNECTED. No-op if it already exists.
insert into public.email_integration_status (id, provider, status)
values (1, 'GMAIL', 'DISCONNECTED')
on conflict (id) do nothing;

-- Keep updated_at fresh (reuses the repo's set_updated_at() from 0000).
drop trigger if exists set_updated_at on public.email_integration_status;
create trigger set_updated_at before update on public.email_integration_status
  for each row execute function public.set_updated_at();

alter table public.email_integration_status enable row level security;

-- Admin-only read. Writes happen via the service_role edge function (bypasses
-- RLS), so no anon/authenticated write policy is granted.
drop policy if exists eis_select_admin on public.email_integration_status;
create policy eis_select_admin on public.email_integration_status
  for select using (public.is_admin());
