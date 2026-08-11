-- =====================================================================
-- Subscription rows inspect (READ-ONLY).
-- Ctrl+A -> Delete phir paste karein.
-- =====================================================================

select
  s.status,
  s.stripe_subscription_id,
  s.stripe_customer_id,
  s.created_at
from public.subscriptions s
join auth.users u on u.id = s.user_id
where u.email = 'divyanshutest2@gmail.com'
order by s.created_at desc;

-- Kya dekhna hai:
--   Sirf EK row mein stripe_subscription_id hona chahiye — wahi asli hai,
--   aur Stripe pause/resume usi par kaam karta hai. Uska status ab 'paused'
--   dikhna chahiye.
--
--   Baaki rows (jinme stripe_subscription_id NULL hai) junk hain — adhoore
--   checkout attempts. App ab inhe ignore karta hai, par inhe hata dena
--   behtar hai (neeche STEP 2).
