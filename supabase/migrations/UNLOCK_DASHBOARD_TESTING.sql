-- =====================================================================
-- Dashboard unlock (TESTING) — ek hi email ke liye
--
-- IMPORTANT: SQL editor poora tab chalata hai. Paste karne se pehle
-- Ctrl+A -> Delete karein, ya naya query tab kholein.
--
-- Sirf neeche wali email badlein, aur kuch nahi.
-- =====================================================================

-- ---------- STEP A: pehle dekhein state kya hai (kuch badalta nahi) ----------
select
  u.email,
  s.status                as sub_status,
  rc.details_submitted,
  rc.company_name,
  rc.status               as legacy_status,
  rc.current_status
from auth.users u
left join public.subscriptions     s  on s.user_id  = u.id
left join public.roofing_companies rc on rc.user_id = u.id
where u.email = 'divyanshutest2@gmail.com';


-- ---------- STEP B: subscription ko 'trialing' karein ----------
-- NOTE: subscriptions.user_id par UNIQUE constraint nahi hai (sirf index),
-- isliye "on conflict (user_id)" FAIL karta. Update-then-insert use kar rahe hain.

update public.subscriptions
set status = 'trialing',
    trial_ends_at = now() + interval '7 days',
    updated_at = now()
where user_id = (select id from auth.users where email = 'divyanshutest2@gmail.com');

-- Row nahi thi toh ab bana dein (agar update ne kuch chhua toh yeh skip ho jayega)
insert into public.subscriptions (user_id, status, trial_ends_at)
select u.id, 'trialing', now() + interval '7 days'
from auth.users u
where u.email = 'divyanshutest2@gmail.com'
  and not exists (select 1 from public.subscriptions s where s.user_id = u.id);


-- ---------- STEP C: business details ko "submitted" mark karein ----------
-- roofing_companies.user_id UNIQUE hai, aur company_name NOT NULL hai —
-- isliye insert mein company_name dena zaroori hai.

insert into public.roofing_companies (user_id, company_name, details_submitted, status)
select u.id, 'Test Roofing Co', true, 'new'
from auth.users u
where u.email = 'divyanshutest2@gmail.com'
on conflict (user_id) do update
  set details_submitted = true;


-- ---------- STEP D: verify — dono values sahi honi chahiye ----------
-- sub_status = 'trialing'  AND  details_submitted = true
select
  u.email,
  s.status as sub_status,
  rc.details_submitted
from auth.users u
left join public.subscriptions     s  on s.user_id  = u.id
left join public.roofing_companies rc on rc.user_id = u.id
where u.email = 'divyanshutest2@gmail.com';
