-- ============================================================================
-- Roof AI Lead Recovery — 0018 DOWN: revert to the blank 0017 signup stub
-- ============================================================================
-- Restores handle_new_user_company() to the 0017 behaviour (insert a blank stub
-- row on signup). Does NOT null out contact_name / contact_email /
-- business_phone on rows already populated — that data is legitimate customer
-- data and removing it is destructive. If you truly want it gone, do it
-- deliberately and manually after reviewing the selection:
--
--   update public.roofing_companies
--   set contact_name = null, contact_email = null, business_phone = null
--   where details_submitted = false and company_name = '';
--
-- To remove the trigger entirely, run 0017_prefill_company_on_signup.down.sql
-- after this file.
-- ============================================================================

create or replace function public.handle_new_user_company()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.roofing_companies (user_id, company_name, details_submitted)
  values (new.id, '', false)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_company on auth.users;
create trigger on_auth_user_created_company
  after insert on auth.users
  for each row execute function public.handle_new_user_company();

-- ============================================================================
-- DONE.
-- ============================================================================
