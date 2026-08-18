-- ============================================================================
-- Roof AI Lead Recovery — 0017: pre-create roofing_companies row on signup
-- ============================================================================
-- WHY:
--   Previously a roofing_companies row was created ONLY when the customer
--   clicked submit on the FINAL step of the onboarding form (OnboardingPage's
--   upsert). A user who signed up, paid, and started onboarding but did not
--   finish had NO row at all — so "not submitted" was the ABSENCE of a row, not
--   a queryable false flag.
--
--   To drive an n8n reminder automation ("email people who signed up but never
--   finished onboarding"), we want every signed-up user to have a row with
--   details_submitted = false from the moment they sign up. The onboarding
--   form's final submit still flips details_submitted -> true, which drops them
--   from the campaign.
--
-- WHAT:
--   A SECURITY DEFINER trigger on auth.users (AFTER INSERT), alongside the
--   existing on_auth_user_created (handle_new_user) trigger, that inserts a
--   stub roofing_companies row keyed by the new user's id.
--
-- NOTES:
--   * company_name is NOT NULL with no default (0000_full_setup.sql), so the
--     stub uses '' — the onboarding form overwrites it with the real name.
--     '' is a clean, filterable "not provided yet" marker.
--   * details_submitted defaults to false (0002); we set it explicitly for
--     clarity. status defaults to 'new' (0002) and current_status to 'NEW'
--     (0006) — both fine for a fresh signup, so we don't set them here.
--   * on conflict (user_id) do nothing → idempotent and safe if a row somehow
--     already exists (e.g. re-run, or a future path that creates it earlier).
--   * This does NOT modify handle_new_user; the two triggers are independent.
--
-- IMPORTANT (email confirmation): auth.users gets its row at signUp() time
--   regardless of whether "Confirm email" is ON or OFF, so this trigger fires at
--   signup in both modes. If you only want to count CONFIRMED users in your
--   campaign, filter your n8n query on auth.users.email_confirmed_at IS NOT NULL
--   rather than changing this trigger.
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

-- Backfill: give a stub row to any EXISTING user who doesn't have one yet, so
-- your automation sees the full population, not just users created from now on.
insert into public.roofing_companies (user_id, company_name, details_submitted)
select u.id, '', false
from auth.users u
left join public.roofing_companies rc on rc.user_id = u.id
where rc.user_id is null
on conflict (user_id) do nothing;

-- ============================================================================
-- DONE.
-- ============================================================================
