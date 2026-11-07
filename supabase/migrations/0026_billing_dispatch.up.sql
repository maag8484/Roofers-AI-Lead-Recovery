-- Disabled until sandbox billing and provider delivery have been verified.
create table public.roof_billing_control (
 id boolean primary key default true check(id),
 billing_enabled boolean not null default false,
 warnings_enabled boolean not null default false
);
insert into public.roof_billing_control(id) values(true);
alter table public.roof_billing_control enable row level security;
revoke all on public.roof_billing_control from public,anon,authenticated;
grant select on public.roof_billing_control to service_role;

create table public.roof_billing_dispatch_receipts (
 request_id bigint primary key, kind text not null check(kind in ('billing','warning')),
 source_id text not null, requested_at timestamptz not null default now()
);
alter table public.roof_billing_dispatch_receipts enable row level security;
revoke all on public.roof_billing_dispatch_receipts from public,anon,authenticated;
grant select on public.roof_billing_dispatch_receipts to service_role;

-- Tokens are read only inside this non-client-callable function. Never place
-- bearer tokens in cron command text. HTTP acceptance is not charge/mail proof.
create function public.dispatch_roof_billing_jobs() returns integer
language plpgsql security definer set search_path='' as $$
declare cfg public.roof_billing_control%rowtype; token text; row record;
 req bigint; dispatched integer:=0;
begin
 if not pg_try_advisory_xact_lock(146237201,199) then return 0; end if;
 select * into strict cfg from public.roof_billing_control where id;
 if cfg.billing_enabled then
  select decrypted_secret into token from vault.decrypted_secrets where name='roof_founder_worker_secret';
  if token is null or length(token)<32 then raise exception 'Missing founder worker configuration'; end if;
  for row in select a.reservation_id from public.roof_founder_activations a
    join public.roofing_companies c on c.id=a.company_id and c.user_id=a.user_id
    where c.is_live and c.details_submitted and a.canceled_at is null
      and a.claimed_at is null and a.stripe_subscription_id is null
      and a.activated_at+interval '336 hours'<=statement_timestamp()
      and a.activated_at+interval '337 hours'>statement_timestamp()
    order by a.activated_at limit 10 loop
   select net.http_post(url:='https://vmafjqsthbrnjusowolj.supabase.co/functions/v1/bill-due-founder',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||token),
    body:=jsonb_build_object('reservation_id',row.reservation_id),timeout_milliseconds:=10000) into req;
   insert into public.roof_billing_dispatch_receipts values(req,'billing',row.reservation_id,statement_timestamp());
   dispatched:=dispatched+1;
  end loop;
 end if;
 if cfg.warnings_enabled then
  select decrypted_secret into token from vault.decrypted_secrets where name='roof_warning_worker_secret';
  if token is null or length(token)<32 then raise exception 'Missing warning worker configuration'; end if;
  for row in select w.period_id from public.roof_usage_warning_outbox w
    join public.roof_paid_periods p on p.id=w.period_id
    where w.delivery_state='pending' and p.starts_at<=statement_timestamp() and p.ends_at>statement_timestamp()
    order by w.created_at limit 50 loop
   select net.http_post(url:='https://vmafjqsthbrnjusowolj.supabase.co/functions/v1/dispatch-usage-warning',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||token),
    body:=jsonb_build_object('period_id',row.period_id),timeout_milliseconds:=10000) into req;
   insert into public.roof_billing_dispatch_receipts values(req,'warning',row.period_id::text,statement_timestamp());
   dispatched:=dispatched+1;
  end loop;
 end if;
 return dispatched;
end;
$$;
revoke all on function public.dispatch_roof_billing_jobs() from public,anon,authenticated,service_role;

-- Operations must reconcile these; never turn an uncertain charge/email into
-- another automatic attempt. Expose IDs only to the trusted service role.
create view public.roof_billing_attention with (security_invoker=true) as
 select 'billing'::text as kind,reservation_id as source_id,
  case when claimed_at is not null then 'charge_unreconciled' else 'overdue_manual_review' end as reason
 from public.roof_founder_activations where canceled_at is null and stripe_subscription_id is null
 and ((claimed_at is not null and claimed_at<now()-interval '15 minutes')
      or (claimed_at is null and activated_at+interval '337 hours'<=now()))
 union all select 'warning',period_id::text,'delivery_unreconciled'
 from public.roof_usage_warning_outbox where delivery_state='claimed';
revoke all on public.roof_billing_attention from public,anon,authenticated;
grant select on public.roof_billing_attention to service_role;
