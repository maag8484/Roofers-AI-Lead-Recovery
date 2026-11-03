create function public.my_roof_founder_trial() returns table(reservation_id text,first_charge_at timestamptz,canceled_at timestamptz,claimed_at timestamptz) language sql stable security definer set search_path='' as $$
 select a.reservation_id,a.activated_at+interval '336 hours',a.canceled_at,a.claimed_at from public.roof_founder_activations a where a.user_id=auth.uid() and a.stripe_subscription_id is null order by a.activated_at desc;
$$;
revoke all on function public.my_roof_founder_trial() from public,anon;
grant execute on function public.my_roof_founder_trial() to authenticated;