-- ============================================================================
-- 0010 UP — activity_logs (operational action feed)
-- customer_id nullable (system-level actions); performed_by nullable (system).
-- RLS: admin-only read. Inserts via service_role edge functions. Idempotent.
-- ============================================================================

create table if not exists public.activity_logs (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid references public.roofing_companies(id) on delete set null,
  action       text not null,
  performed_by uuid references public.admins(user_id) on delete set null,
  result       text,
  status       text,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists activity_logs_customer_created_idx
  on public.activity_logs (customer_id, created_at desc);
create index if not exists activity_logs_created_idx
  on public.activity_logs (created_at desc);

alter table public.activity_logs enable row level security;

drop policy if exists al_select_admin on public.activity_logs;
create policy al_select_admin on public.activity_logs
  for select using (public.is_admin());
