-- Persistent public Missed Revenue Audit intake. PII is admin-only; the public
-- browser never receives database credentials and writes through a Vercel API.
create table if not exists public.audit_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  company text not null,
  service_area text not null,
  phone text,
  preferred_contact text not null check (preferred_contact in ('email', 'phone')),
  current_process text,
  contact_consent boolean not null check (contact_consent),
  marketing_consent boolean not null default false,
  consent_version text not null,
  consented_at timestamptz not null,
  submission_page text,
  attribution jsonb not null default '{}'::jsonb,
  calculator jsonb not null default '{}'::jsonb,
  rate_key text not null,
  status text not null default 'new' check (status in ('new','contacted','qualified','closed','spam')),
  created_at timestamptz not null default now()
);

create index if not exists audit_requests_created_idx on public.audit_requests (created_at desc);
create index if not exists audit_requests_rate_idx on public.audit_requests (rate_key, created_at desc);
alter table public.audit_requests enable row level security;

drop policy if exists audit_requests_admin_select on public.audit_requests;
create policy audit_requests_admin_select on public.audit_requests for select using (public.is_admin());

drop policy if exists audit_requests_admin_update on public.audit_requests;
create policy audit_requests_admin_update on public.audit_requests for update using (public.is_admin()) with check (public.is_admin());

create or replace function public.submit_public_audit_request(
  p_request jsonb,
  p_rate_key text,
  p_limit integer default 5
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  -- Serialize requests from the same hashed source so concurrent submissions
  -- cannot race around the hourly limit.
  perform pg_advisory_xact_lock(hashtextextended(p_rate_key, 0));
  if (select count(*) from public.audit_requests where rate_key = p_rate_key and created_at > now() - interval '1 hour') >= greatest(1, least(p_limit, 20)) then
    return jsonb_build_object('error', 'RATE_LIMITED');
  end if;

  insert into public.audit_requests (
    full_name, email, company, service_area, phone, preferred_contact,
    current_process, contact_consent, marketing_consent, consent_version,
    consented_at, submission_page, attribution, calculator, rate_key
  ) values (
    left(p_request->>'full_name', 100), left(p_request->>'email', 254),
    left(p_request->>'company', 150), left(p_request->>'service_area', 150),
    nullif(left(p_request->>'phone', 30), ''), p_request->>'preferred_contact',
    nullif(left(p_request->>'current_process', 500), ''),
    coalesce((p_request->>'contact_consent')::boolean, false),
    coalesce((p_request->>'marketing_consent')::boolean, false),
    left(p_request->>'consent_version', 50),
    (p_request->>'consented_at')::timestamptz,
    left(p_request->>'submission_page', 500),
    coalesce(p_request->'attribution', '{}'::jsonb),
    coalesce(p_request->'calculator', '{}'::jsonb), p_rate_key
  ) returning id into v_id;

  insert into public.admin_notifications (type, title, body, severity, metadata)
  values ('AUDIT_REQUEST', 'New missed revenue audit request',
    'A roofing company requested a missed revenue audit.', 'INFO',
    jsonb_build_object('audit_request_id', v_id));

  return jsonb_build_object('id', v_id);
end;
$$;

revoke all on function public.submit_public_audit_request(jsonb, text, integer) from public, anon, authenticated;
grant execute on function public.submit_public_audit_request(jsonb, text, integer) to service_role;

revoke all on table public.audit_requests from anon, authenticated;
