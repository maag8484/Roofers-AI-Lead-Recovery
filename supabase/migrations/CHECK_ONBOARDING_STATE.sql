-- =====================================================================
-- Onboarding state check (READ-ONLY — kuch badalta nahi).
--
-- SQL editor poora tab chalata hai: Ctrl+A -> Delete phir paste karein.
-- =====================================================================

-- Kya roofing_companies row maujood hai aur details_submitted true hai?
select
  u.email,
  rc.id is not null            as company_row_exists,
  rc.details_submitted,
  rc.company_name,
  rc.contact_email,
  rc.conversion_preference,
  rc.status                    as legacy_status,
  rc.current_status,
  rc.updated_at
from auth.users u
left join public.roofing_companies rc on rc.user_id = u.id
where u.email = 'divyanshutest2@gmail.com';

-- Ummeed:
--   company_row_exists = true
--   details_submitted  = true
--
-- Agar details_submitted = FALSE hai -> form ka submit DB tak nahi pahuncha.
--   Us soorat mein form dobara bharein aur aakhri step par "Submit" dabayein,
--   phir browser console (F12) mein koi red error dekhein.
--
-- Agar company_row_exists = FALSE hai -> row bani hi nahi (RLS ya submit fail).
