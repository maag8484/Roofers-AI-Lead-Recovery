-- Optional AI demo request intake; apply before deploying the updated API/UI.
-- This migration neither queues calls nor changes the suppression store.
begin;

alter table public.audit_requests
  add column ai_demo_requested boolean not null default false,
  add column ai_demo_consent jsonb;

alter table public.audit_requests add constraint audit_requests_ai_demo_evidence_check
check (
  (not ai_demo_requested and ai_demo_consent is null)
  or (ai_demo_requested and coalesce(
    jsonb_typeof(ai_demo_consent) = 'object'
    and ai_demo_consent->>'version' = 'ai-demo-call-v1'
    and length(ai_demo_consent->>'text') between 1 and 2000
    and ai_demo_consent->>'phone_e164' ~ '^\+1[2-9][0-9]{2}[2-9][0-9]{6}$'
    and length(ai_demo_consent->>'signer_name') between 1 and 100
    and jsonb_typeof(ai_demo_consent->'signed_at') = 'string'
    and (ai_demo_consent->>'signed_at')::timestamptz is not null
    and ai_demo_consent->>'scope' = 'roof_ai_ai_voice_sales_demo'
    and ai_demo_consent->'max_calls' = '1'::jsonb
    and ai_demo_consent->>'method' = 'checkbox_and_typed_name', false))
);

-- Operators can change audit status, but not overwrite the original permission.
create function public.preserve_audit_ai_demo_consent()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.ai_demo_requested is distinct from old.ai_demo_requested
    or new.ai_demo_consent is distinct from old.ai_demo_consent then
    raise exception 'AI demo consent evidence is immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger audit_requests_preserve_ai_demo_consent
  before update on public.audit_requests
  for each row execute function public.preserve_audit_ai_demo_consent();

create or replace function public.submit_public_audit_request(
  p_request jsonb,
  p_rate_key text,
  p_email_key text,
  p_limit integer default 5
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_demo_requested boolean := coalesce(p_request->'ai_demo_requested' = 'true'::jsonb, false);
  v_demo_consent jsonb;
begin
  -- Serialize requests from the same hashed source so concurrent submissions
  -- cannot race around the hourly limit.
  perform pg_advisory_xact_lock(hashtextextended(p_rate_key, 0));
  perform pg_advisory_xact_lock(hashtextextended(p_email_key, 0));
  if (select count(*) from public.audit_requests where rate_key = p_rate_key and created_at > now() - interval '1 hour') >= greatest(1, least(p_limit, 20)) then
    return jsonb_build_object('error', 'RATE_LIMITED');
  end if;
  if (select count(*) from public.audit_requests where email_key = p_email_key and created_at > now() - interval '24 hours') >= 3 then
    return jsonb_build_object('error', 'RATE_LIMITED');
  end if;

  if v_demo_requested then
    -- The service API supplies the disclosure version/text; only the database
    -- stamps committed evidence. Ignore any client-supplied timestamp/status.
    v_demo_consent := jsonb_build_object(
      'version', p_request->'ai_demo_consent'->>'version',
      'text', p_request->'ai_demo_consent'->>'text',
      'phone_e164', p_request->'ai_demo_consent'->>'phone_e164',
      'signer_name', left(p_request->>'full_name', 100),
      'signed_at', now(),
      'scope', 'roof_ai_ai_voice_sales_demo',
      'max_calls', 1,
      'method', 'checkbox_and_typed_name',
      'submission_page', left(p_request->>'submission_page', 500)
    );
  end if;

  insert into public.audit_requests (
    full_name, email, company, service_area, phone, preferred_contact,
    current_process, contact_consent, marketing_consent, consent_version,
    consented_at, submission_page, attribution, calculator, rate_key, email_key,
    ai_demo_requested, ai_demo_consent
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
    coalesce(p_request->'calculator', '{}'::jsonb), p_rate_key, p_email_key,
    v_demo_requested, v_demo_consent
  ) returning id into v_id;

  insert into public.admin_notifications (type, title, body, severity, metadata)
  values ('AUDIT_REQUEST', 'New missed revenue audit request',
    case when v_demo_requested then 'A roofing company requested an audit and one AI demo call. Review required before calling.'
      else 'A roofing company requested a missed revenue audit.' end, 'INFO',
    jsonb_build_object('audit_request_id', v_id, 'link', '/admin/audit-requests?request=' || v_id::text));

  return jsonb_build_object('id', v_id, 'ai_demo_consent_saved', v_demo_requested and v_demo_consent is not null);
end;
$$;

revoke all on function public.submit_public_audit_request(jsonb, text, text, integer) from public, anon, authenticated;
grant execute on function public.submit_public_audit_request(jsonb, text, text, integer) to service_role;

-- RLS from 0020 still requires is_admin(). Column-level grants permit the
-- existing admin inbox status action without allowing edits to consent evidence.
grant select on public.audit_requests to authenticated;
grant update (status) on public.audit_requests to authenticated;

commit;
