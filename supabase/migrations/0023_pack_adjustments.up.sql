-- Keep purchase history; exclude reversed packs even if events arrive out of order.
create table public.roof_pack_holds (
 stripe_event_id text primary key,
 payment_intent_id text not null,
 reason text not null check(reason in ('refund','dispute'))
);
create index roof_pack_holds_intent on public.roof_pack_holds(payment_intent_id);
alter table public.roof_pack_holds enable row level security;
revoke all on public.roof_pack_holds from public, anon, authenticated;
grant select,insert on public.roof_pack_holds to service_role;
create view public.roof_available_packs with (security_invoker=true) as
 select p.* from public.roof_call_pack_receipts p where not exists
 (select from public.roof_pack_holds h where h.payment_intent_id=p.payment_intent_id);
revoke all on public.roof_available_packs from public, anon, authenticated;
grant select on public.roof_available_packs to service_role;
create or replace function public.record_roof_recovery(p_period uuid, p_event text, p_at timestamptz)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  period public.roof_paid_periods%rowtype;
  counted integer;
begin
  select * into strict period from public.roof_paid_periods where id=p_period for update;
  if p_event is null or trim(p_event)='' or p_at is null or p_at < period.starts_at or p_at >= period.ends_at or p_at > now() then
    raise exception 'Invalid recovery receipt';
  end if;
  insert into public.roof_recovered_call_receipts(period_id,provider_event_id,occurred_at)
    values(p_period,p_event,p_at) on conflict do nothing;
  select count(*) into counted from public.roof_recovered_call_receipts where period_id=p_period;
  if counted >= 65 and counted < 75 and now() < period.ends_at
     and not exists (select from public.roof_available_packs where period_id=p_period) then
    insert into public.roof_usage_warning_outbox(period_id) values(p_period) on conflict do nothing;
  end if;
end;
$$;
revoke all on function public.record_roof_recovery(uuid,text,timestamptz) from public, anon, authenticated;
grant execute on function public.record_roof_recovery(uuid,text,timestamptz) to service_role;
