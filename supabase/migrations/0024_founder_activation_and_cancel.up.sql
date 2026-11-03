-- One immutable activation per company/reservation. Service records verified setup,
-- live-test and separate consent receipts; app users may only cancel their own pilot.
create table public.roof_founder_activations (
 reservation_id text primary key, user_id uuid not null references auth.users(id),
 company_id uuid not null unique references public.roofing_companies(id),
 customer_id text not null unique, setup_session_id text not null unique,
 live_test_receipt text not null unique, activated_at timestamptz not null,
 consent_version text not null check(consent_version='pilot-14d-40calls-199-card-v4'),
 canceled_at timestamptz, claimed_at timestamptz, stripe_subscription_id text unique,
 check(length(trim(live_test_receipt))>0), check(customer_id like 'cus_%'),
 check(setup_session_id like 'cs_%')
);
alter table public.roof_founder_activations enable row level security;
revoke all on public.roof_founder_activations from public,anon,authenticated;
grant select,insert on public.roof_founder_activations to service_role;
grant update (stripe_subscription_id) on public.roof_founder_activations to service_role;

create function public.cancel_roof_founder_trial(p_reservation text)
returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 update public.roof_founder_activations set canceled_at=coalesce(canceled_at,statement_timestamp())
 where reservation_id=p_reservation and user_id=auth.uid() and claimed_at is null
 and stripe_subscription_id is null;
 get diagnostics n=row_count;
 return n=1;
end;
$$;
revoke all on function public.cancel_roof_founder_trial(text) from public,anon;
grant execute on function public.cancel_roof_founder_trial(text) to authenticated;

-- Only a fresh claim can initiate a charge; uncertain attempts must be reconciled
-- by reservation and Stripe idempotency key, never blindly claimed again.
create function public.claim_due_roof_founder_trial(p_reservation text)
returns setof public.roof_founder_activations language sql security definer set search_path='' as $$
 update public.roof_founder_activations a set claimed_at=statement_timestamp()
 from public.roofing_companies c
 where a.reservation_id=p_reservation and a.company_id=c.id and a.user_id=c.user_id
 and c.is_live and c.details_submitted and a.canceled_at is null and a.claimed_at is null
 and a.stripe_subscription_id is null and a.activated_at + interval '336 hours' <= statement_timestamp()
 and a.activated_at + interval '337 hours' > statement_timestamp()
 returning a.*;
$$;
revoke all on function public.claim_due_roof_founder_trial(text) from public,anon,authenticated;
grant execute on function public.claim_due_roof_founder_trial(text) to service_role;
