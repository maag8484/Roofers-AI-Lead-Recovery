-- ============================================================================
-- 0009 UP — admin_notifications (notification center feed)
-- RLS: admin-only read + update (mark-as-read). Inserts come from the
-- service_role edge functions (bypass RLS). Idempotent.
-- ============================================================================

create table if not exists public.admin_notifications (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,                        -- e.g. GMAIL_RECONNECTED
  title       text not null,
  body        text,
  severity    text not null default 'INFO',
  read_at     timestamptz,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  constraint admin_notifications_severity_chk
    check (severity in ('INFO','WARNING','CRITICAL'))
);

create index if not exists admin_notifications_read_created_idx
  on public.admin_notifications (read_at, created_at desc);

alter table public.admin_notifications enable row level security;

drop policy if exists an_select_admin on public.admin_notifications;
create policy an_select_admin on public.admin_notifications
  for select using (public.is_admin());

-- Admins may mark notifications as read (update read_at).
drop policy if exists an_update_admin on public.admin_notifications;
create policy an_update_admin on public.admin_notifications
  for update using (public.is_admin()) with check (public.is_admin());
