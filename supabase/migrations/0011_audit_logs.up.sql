-- ============================================================================
-- 0011 UP — audit_logs (field-level change trail: who changed what, old->new)
-- RLS: admin-only read. Inserts via service_role edge functions. Idempotent.
-- ============================================================================

create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.admins(user_id) on delete set null,
  entity_type  text not null,
  entity_id    text not null,
  field        text,
  old_value    text,
  new_value    text,
  ip_address   inet,
  created_at   timestamptz not null default now()
);

create index if not exists audit_logs_entity_created_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists aud_select_admin on public.audit_logs;
create policy aud_select_admin on public.audit_logs
  for select using (public.is_admin());
