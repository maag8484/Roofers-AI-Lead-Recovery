-- Service-only delivery ledger. A claim is never automatically retried.
create table public.vapi_signup_deliveries (
 id uuid primary key default gen_random_uuid(),
 source_call_id uuid not null unique,
 audit_request_id uuid references public.audit_requests(id),
 recipient text not null check (recipient = lower(recipient)),
 phone_e164 text not null,
 test_mode boolean not null,
 confirmation jsonb not null,
 template_version text not null,
 status text not null default 'claimed' check (status in ('claimed','accepted','delivery_unknown','rejected','delivered','bounce','dropped','spamreport','unsubscribe','group_unsubscribe')),
 provider_id text, http_status integer,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 delivered_at timestamptz
);
create table public.vapi_email_suppressions (
 email text primary key check (email = lower(email)), reason text not null,
 created_at timestamptz not null default now()
);
create table public.vapi_delivery_events (
 event_id text primary key, delivery_id uuid not null references public.vapi_signup_deliveries(id),
 event_type text not null, occurred_at timestamptz not null, received_at timestamptz not null default now()
);
alter table public.vapi_signup_deliveries enable row level security;
alter table public.vapi_email_suppressions enable row level security;
alter table public.vapi_delivery_events enable row level security;
revoke all on public.vapi_signup_deliveries, public.vapi_email_suppressions, public.vapi_delivery_events from anon, authenticated;
grant all on public.vapi_signup_deliveries, public.vapi_email_suppressions, public.vapi_delivery_events to service_role;

create function public.claim_vapi_signup_delivery(p_delivery jsonb) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_row public.vapi_signup_deliveries; v_email text := lower(p_delivery->>'recipient');
begin
 -- Serialize claims and suppression events for this recipient.
 perform pg_advisory_xact_lock(hashtextextended(v_email, 0));
 if exists(select 1 from public.vapi_email_suppressions where email = v_email) then
  return jsonb_build_object('claimed',false,'status','suppressed');
 end if;
 insert into public.vapi_signup_deliveries(source_call_id,audit_request_id,recipient,phone_e164,test_mode,confirmation,template_version)
 values ((p_delivery->>'source_call_id')::uuid,(p_delivery->>'audit_request_id')::uuid,v_email,
 p_delivery->>'phone_e164',(p_delivery->>'test_mode')::boolean,p_delivery->'confirmation',p_delivery->>'template_version')
 on conflict (source_call_id) do nothing returning * into v_row;
 if found then return jsonb_build_object('claimed',true,'id',v_row.id,'status',v_row.status); end if;
 select * into v_row from public.vapi_signup_deliveries where source_call_id=(p_delivery->>'source_call_id')::uuid;
 return jsonb_build_object('claimed',false,'id',v_row.id,'status',v_row.status);
end $$;

create function public.finish_vapi_signup_delivery(p_id uuid,p_status text,p_provider_id text,p_http_status integer) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
begin
 if p_status not in ('accepted','delivery_unknown','rejected') then raise exception 'Invalid dispatch status'; end if;
 update public.vapi_signup_deliveries set
  status=case when status in ('claimed','accepted','delivery_unknown','rejected') then p_status else status end,
  provider_id=coalesce(p_provider_id,provider_id),http_status=p_http_status,updated_at=now() where id=p_id;
 if not found then raise exception 'Unknown delivery'; end if;
 return jsonb_build_object('recorded',true);
end $$;

create function public.record_vapi_delivery_event(p_event jsonb) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_row public.vapi_signup_deliveries; v_type text:=p_event->>'event'; v_time timestamptz;
begin
 if v_type not in ('delivered','bounce','dropped','spamreport','unsubscribe','group_unsubscribe') then
  return jsonb_build_object('recorded',false);
 end if;
 perform pg_advisory_xact_lock(hashtextextended(lower(p_event->>'email'),0));
 select * into v_row from public.vapi_signup_deliveries where id=(p_event->>'delivery_id')::uuid
 and recipient=lower(p_event->>'email') for update;
 if not found then return jsonb_build_object('recorded',false); end if;
 v_time:=to_timestamp((p_event->>'timestamp')::double precision);
 insert into public.vapi_delivery_events(event_id,delivery_id,event_type,occurred_at)
 values(p_event->>'event_id',v_row.id,v_type,v_time) on conflict do nothing;
 if not found then return jsonb_build_object('recorded',false,'duplicate',true); end if;
 if v_type <> 'delivered' then
  insert into public.vapi_email_suppressions(email,reason) values(v_row.recipient,v_type) on conflict do nothing;
 end if;
 update public.vapi_signup_deliveries set
 status=case when v_type='delivered' and status in ('bounce','dropped','spamreport','unsubscribe','group_unsubscribe') then status else v_type end,
 delivered_at=case when v_type='delivered' then coalesce(delivered_at,v_time) else delivered_at end,
 updated_at=now() where id=v_row.id;
 return jsonb_build_object('recorded',true);
end $$;
revoke all on function public.claim_vapi_signup_delivery(jsonb) from public, anon, authenticated;
revoke all on function public.finish_vapi_signup_delivery(uuid,text,text,integer) from public, anon, authenticated;
revoke all on function public.record_vapi_delivery_event(jsonb) from public, anon, authenticated;
grant execute on function public.claim_vapi_signup_delivery(jsonb) to service_role;
grant execute on function public.finish_vapi_signup_delivery(uuid,text,text,integer) to service_role;
grant execute on function public.record_vapi_delivery_event(jsonb) to service_role;
