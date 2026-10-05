-- Additive, service-only growth data. Existing customers, checkout and campaigns are untouched.
create table if not exists public.roof_growth_leads (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique,
 audit_request_id uuid not null references public.audit_requests(id) on delete cascade,
 full_name text not null, email text not null, company text not null, service_area text not null,
 score integer not null check(score between 0 and 100),
 fit text not null check(fit in ('not-fit','audit-first','trial-fit')),
 goal text not null check(goal in ('audit','trial','demo')),
 stage text not null default 'new' check(stage in ('new','reviewing','contacted','replied','trial_interest','closed','not_fit')),
 attribution jsonb not null default '{}', qualification jsonb not null default '{}', consent jsonb not null default '{}',
 plan_email_status text not null default 'not_requested',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.roof_growth_leads enable row level security;
revoke all on public.roof_growth_leads from public, anon, authenticated;
grant select,insert,update,delete on public.roof_growth_leads to service_role;
create index if not exists roof_growth_leads_created_idx on public.roof_growth_leads(created_at desc);
create index if not exists roof_growth_leads_audit_idx on public.roof_growth_leads(audit_request_id);
create index if not exists roof_growth_leads_email_idx on public.roof_growth_leads(email);

create or replace function public.submit_roof_growth_lead(p_request_id uuid,p_audit jsonb,p_growth jsonb,p_rate_key text,p_email_key text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare existing public.roof_growth_leads; a jsonb; new_id uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,1));
 select * into existing from public.roof_growth_leads where request_id=p_request_id;
 if found then
  if existing.email <> p_audit->>'email' then return jsonb_build_object('error','REQUEST_CONFLICT'); end if;
  return jsonb_build_object('id',existing.id,'audit_id',existing.audit_request_id,'is_new',false,'email_status',existing.plan_email_status);
 end if;
 a := public.submit_public_audit_request(p_audit,p_rate_key,p_email_key,5);
 if a->>'id' is null then return a; end if;
 insert into public.roof_growth_leads(request_id,audit_request_id,full_name,email,company,service_area,score,fit,goal,attribution,qualification,consent,plan_email_status)
 values(p_request_id,(a->>'id')::uuid,p_audit->>'full_name',p_audit->>'email',p_audit->>'company',p_audit->>'service_area',(p_growth->'qualification'->>'score')::integer,p_growth->'qualification'->>'fit',p_growth->>'goal',p_audit->'attribution',p_growth->'qualification',jsonb_build_object('version','roof-growth-v1','text',p_growth->>'consentText','contact',true,'email_plan',p_growth->'emailPlan','marketing',false,'ai_call',false,'signed_at',now()),case when p_growth->'emailPlan'='true'::jsonb then 'pending' else 'not_requested' end)
 returning id into new_id;
 return jsonb_build_object('id',new_id,'audit_id',a->>'id','is_new',true);
end; $$;
revoke all on function public.submit_roof_growth_lead(uuid,jsonb,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.submit_roof_growth_lead(uuid,jsonb,jsonb,text,text) to service_role;

create or replace function public.roof_growth_summary() returns jsonb language sql stable security invoker set search_path=public as $$
 select jsonb_build_object('requests',count(*),'uniqueCompanies',count(distinct lower(company)),'trialFit',count(*) filter(where fit='trial-fit'),'reviewNeeded',count(*) filter(where stage='new'),'trialInterest',count(*) filter(where goal='trial'),'planEmailsAccepted',count(*) filter(where plan_email_status='accepted'),'sources',(select coalesce(jsonb_agg(s),'[]'::jsonb) from (select coalesce(nullif(attribution->>'utm_source',''),'direct') as source,count(*) as requests,count(*) filter(where fit='trial-fit') as qualified from public.roof_growth_leads group by 1 order by 2 desc) s)) from public.roof_growth_leads;
$$;
revoke all on function public.roof_growth_summary() from public,anon,authenticated;
grant execute on function public.roof_growth_summary() to service_role;
