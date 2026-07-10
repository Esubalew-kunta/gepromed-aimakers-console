-- ============================================================================
-- Security-advisor hardening (2026-07-10). Clears the ERROR + function warnings
-- from Supabase advisors. The always-true RLS policies are intentional (the
-- console authenticates with its own cookie auth + service_role; RLS is a
-- backstop), so those are left as-is by design.
-- Project: hdvqiiprylrrzrkydtpa.
-- ============================================================================

-- ERROR: the reminder view ran as SECURITY DEFINER. Make it SECURITY INVOKER so
-- it respects the caller's RLS (n8n / app use service_role, which still works;
-- anon has no grant on it).
alter view trainee_due_reminders set (security_invoker = true);

-- WARN: pin search_path on trigger functions (prevents search_path hijacking).
alter function set_lead_ref() set search_path = public;
alter function touch_updated_at() set search_path = public;
alter function bump_enrolled() set search_path = public;
alter function set_eng_ref() set search_path = public;
