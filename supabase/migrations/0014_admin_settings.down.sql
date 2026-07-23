-- ============================================================================
-- 0014 DOWN — drop admin settings/preferences tables and the three admin RPCs.
-- ============================================================================

drop function if exists public.admin_remove_admin(uuid);
drop function if exists public.admin_add_admin(text);
drop function if exists public.admin_list_admins();

drop table if exists public.admin_notification_preferences cascade;
drop table if exists public.admin_settings cascade;
