-- ============================================================================
-- Roof AI Lead Recovery — 0018: populate roofing_companies AT SIGNUP
-- ============================================================================
-- WHY:
--   0017 added a signup trigger that pre-creates a roofing_companies row, but
--   it inserted a BLANK stub (company_name = '', nothing else). Everything the
--   user actually typed at signup — their name and email — only reached
--   public.profiles, so roofing_companies stayed empty until the customer
--   finished the post-payment /onboarding form.
--
--   This migration makes roofing_companies behave like profiles: the data the
--   user provides at signup lands in it immediately, from the same auth.users
--   trigger, keyed off the same signUp() metadata.
--
-- WHAT:
--   Replaces handle_new_user_company() so the signup insert also fills:
--     contact_name   <- raw_user_meta_data->>'full_name'   (same source as profiles.full_name)
--     contact_email  <- auth.users.email                   (the account email)
--     business_phone <- raw_user_meta_data->>'phone'       (same source as profiles.phone)
--     company_name   <- raw_user_meta_data->>'company_name' when present, else ''
--
--   These are exactly the roofing_companies columns that correspond to what
--   signup collects. Every other column (service_area, services, calendly_link,
--   business_hours, …) is still collected by the /onboarding form, which
--   upserts over this row.
--
-- NOTES:
--   * company_name is NOT NULL with no default (0000), so it falls back to ''.
--     '' remains the filterable "not provided yet" marker used by 0017.
--   * details_submitted stays FALSE — signup data is not the full onboarding
--     submission. The /onboarding form's final submit still flips it to true,
--     which is what drops a user from the n8n reminder campaign.
--   * status ('new') and current_status ('NEW') keep their column defaults;
--     we never write `status` directly (0016 derives it from current_status).
--   * on conflict (user_id) do nothing → idempotent; never clobbers a row that
--     the onboarding form has already populated.
--   * Runs alongside handle_new_user (profiles); the two triggers are
--     independent and neither depends on the other's ordering.
-- ============================================================================

create or replace function public.handle_new_user_company()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.roofing_companies (
    user_id,
    company_name,
    contact_name,
    contact_email,
    business_phone,
    details_submitted
  )
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'company_name', ''), ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    false
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_company on auth.users;
create trigger on_auth_user_created_company
  after insert on auth.users
  for each row execute function public.handle_new_user_company();

-- ----------------------------------------------------------------------------
-- Backfill A: users who have NO roofing_companies row at all (pre-0017 signups
-- that were never backfilled, or rows deleted since).
-- ----------------------------------------------------------------------------
insert into public.roofing_companies (
  user_id, company_name, contact_name, contact_email, business_phone, details_submitted
)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'company_name', ''), ''),
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data->>'phone', ''),
  false
from auth.users u
left join public.roofing_companies rc on rc.user_id = u.id
where rc.user_id is null
on conflict (user_id) do nothing;

-- ----------------------------------------------------------------------------
-- Backfill B: existing BLANK stub rows created by 0017 — fill in the signup
-- data they were missing. Deliberately narrow: only touches rows the customer
-- has NOT submitted onboarding for, and only fills fields that are currently
-- empty. A customer who already typed a real value never gets overwritten.
-- ----------------------------------------------------------------------------
update public.roofing_companies rc
set
  contact_name   = coalesce(nullif(rc.contact_name,   ''), u.raw_user_meta_data->>'full_name', ''),
  contact_email  = coalesce(nullif(rc.contact_email,  ''), u.email, ''),
  business_phone = coalesce(nullif(rc.business_phone, ''), u.raw_user_meta_data->>'phone', '')
from auth.users u
where u.id = rc.user_id
  and rc.details_submitted = false
  and (
    coalesce(rc.contact_name, '')   = '' or
    coalesce(rc.contact_email, '')  = '' or
    coalesce(rc.business_phone, '') = ''
  );

-- ============================================================================
-- DONE.
-- ============================================================================
