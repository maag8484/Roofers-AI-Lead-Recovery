-- ============================================================================
-- 0007 UP — customer_status_history (audit trail of status transitions)
-- RLS: admin-only (read + insert), matching the repo's is_admin() pattern.
-- Idempotent.
-- ============================================================================

create table if not exists public.customer_status_history (
  id                    uuid primary key default gen_random_uuid(),
  customer_id           uuid not null references public.roofing_companies(id) on delete cascade,
  from_status           public.customer_status_v2,
  to_status             public.customer_status_v2 not null,
  changed_by_admin_id   uuid references public.admins(user_id) on delete set null,
  note                  text,
  created_at            timestamptz not null default now()
);

create index if not exists customer_status_history_customer_created_idx
  on public.customer_status_history (customer_id, created_at desc);

alter table public.customer_status_history enable row level security;

-- Admin-only read.
drop policy if exists csh_select_admin on public.customer_status_history;
create policy csh_select_admin on public.customer_status_history
  for select using (public.is_admin());

-- Admin-only insert (status changes are recorded by admins).
drop policy if exists csh_insert_admin on public.customer_status_history;
create policy csh_insert_admin on public.customer_status_history
  for insert with check (public.is_admin());
