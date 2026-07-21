-- ============================================================================
-- Program workbook storage (GEPROMED_CLIENT_FIXES_PLAN.md Point 2 / client
-- response 2026-07-16 points 6/7): one .xlsx per training, uploaded by Gepromed
-- via the Courses admin, read back by GET /api/programs?session=<slug> to
-- render the branded Qualiopi PDF program. Keyed by an explicit column
-- (survives slug renames) rather than a slug-convention path.
-- Bucket is private: only the server (service-role client in
-- src/lib/supabase.ts) reads/writes it, RLS is irrelevant to that path, so no
-- policies are added here. Safe to re-run.
-- ============================================================================

alter table trainings add column if not exists program_workbook_path text;

insert into storage.buckets (id, name, public)
values ('program-workbooks', 'program-workbooks', false)
on conflict (id) do nothing;
