-- =====================================================================
-- Duplicate subscription rows — inspect and (optionally) clean up.
--
-- subscriptions.user_id has an INDEX but no UNIQUE constraint, so repeated
-- checkouts leave several rows per user. The app now picks the governing row
-- (src/lib/subscription.js), so this cleanup is OPTIONAL — it just makes the
-- data easier to reason about.
--
-- SQL editor runs the WHOLE tab: Ctrl+A -> Delete before pasting.
-- Run STEP 1 first and read it before running anything else.
-- =====================================================================

-- ---------- STEP 1: who has duplicates? (read-only) ----------
select u.email, count(*) as row_count,
       string_agg(s.status, ', ' order by s.created_at desc) as statuses
from public.subscriptions s
join auth.users u on u.id = s.user_id
group by u.email
having count(*) > 1
order by row_count desc;


-- ---------- STEP 2: see every row for one user (read-only) ----------
select s.id, s.status, s.stripe_subscription_id, s.created_at
from public.subscriptions s
join auth.users u on u.id = s.user_id
where u.email = 'divyanshutest2@gmail.com'
order by s.created_at desc;


-- ---------- STEP 3 (OPTIONAL): keep the best row, delete the rest ----------
-- Keeps active > trialing > past_due > paused > incomplete > canceled,
-- tie-broken by newest. Same priority the app uses.
-- Ise chalane se pehle STEP 2 ka result dekh lein.
--
-- with ranked as (
--   select s.id,
--          row_number() over (
--            partition by s.user_id
--            order by case s.status
--                       when 'active'     then 1
--                       when 'trialing'   then 2
--                       when 'past_due'   then 3
--                       when 'paused'     then 4
--                       when 'incomplete' then 5
--                       when 'canceled'   then 6
--                       else 7
--                     end,
--                     s.created_at desc
--          ) as rn
--   from public.subscriptions s
-- )
-- delete from public.subscriptions
-- where id in (select id from ranked where rn > 1);


-- ---------- STEP 4 (OPTIONAL): stop it happening again ----------
-- Only works AFTER step 3 leaves exactly one row per user.
-- NOTE: this changes app behaviour — the Stripe webhook must then UPSERT
-- rather than INSERT. Discuss before enabling.
--
-- create unique index if not exists subscriptions_user_id_key
--   on public.subscriptions(user_id);
