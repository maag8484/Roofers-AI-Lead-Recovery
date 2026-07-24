-- ============================================================================
-- 0006 DOWN — reverse customer_status_v2 additions.
-- Drops the 3 added columns and the enum type. Does NOT touch the original
-- text `status` column (it was never modified).
-- ============================================================================

alter table public.roofing_companies
  drop column if exists current_status,
  drop column if exists admin_notes,
  drop column if exists last_login_at;

-- Enum can only be dropped once no column uses it (handled by the drops above).
do $$
begin
  if exists (select 1 from pg_type where typname = 'customer_status_v2') then
    drop type public.customer_status_v2;
  end if;
end $$;
