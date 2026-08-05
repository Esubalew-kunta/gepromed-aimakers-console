-- ============================================================================
-- Real past-session photo gallery, replacing the bare `photos` COUNT.
--
-- gepromed-web already has a fully built gallery for this: TrainingSession.photos
-- is typed `string[]` (image URLs) and TrainingDetailView renders <PhotoGallery
-- photos={t.photos} /> whenever the array is non-empty. But the actual `trainings.
-- photos` column has always been `int` (a plain admin-typed count with zero real
-- images behind it) — so `t.photos.length` in the web app's rendering guard was
-- silently `undefined` on a number, and the gallery section never actually
-- rendered for ANY training, regardless of what admins entered.
--
-- This migration:
--   1. Converts trainings.photos from int to jsonb (array of public image URLs),
--      matching the shape every other array field on this table already uses
--      (objectives/program/supervisors/sponsors/target_audience are all jsonb).
--      Existing integer values are meaningless placeholders (no real photos ever
--      existed behind them) — dropped, not migrated.
--   2. Creates the `course-images` public Storage bucket. This didn't exist at
--      all before (confirmed via a live "Bucket not found" error when testing
--      the course cover-image upload) — so this also fixes cover-image uploads,
--      which use the same bucket, as a side effect.
--
-- Idempotent: safe to re-run. Project: hdvqiiprylrrzrkydtpa.
-- ============================================================================

alter table trainings alter column photos drop default;
alter table trainings alter column photos type jsonb using '[]'::jsonb;
alter table trainings alter column photos set default '[]'::jsonb;

insert into storage.buckets (id, name, public)
values ('course-images', 'course-images', true)
on conflict (id) do update set public = true;
