-- ============================================================================
-- Apply the previously-written-but-never-applied course_images.sql: the
-- trainings.image_url column and course-images bucket referenced by
-- saveCourse()'s cover-image upload did not actually exist in production.
--
-- Discovered while adding storage cleanup on delete/replace (this migration's
-- sibling, course_photo_gallery.sql, created the bucket but not the column —
-- the original course_images.sql file in this repo targets a stale project
-- ref, aablleekwyjqdxsscyeo, and was apparently never re-run against the
-- current project). Confirmed live: a SELECT for trainings.image_url failed
-- outright with "column trainings.image_url does not exist", which silently
-- broke the new cleanup logic (and meant any save that actually tried to
-- WRITE a cover image would have failed too, though no test before this one
-- had exercised that path).
--
-- Idempotent: safe to re-run. Project: hdvqiiprylrrzrkydtpa.
-- ============================================================================

alter table trainings add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('course-images', 'course-images', true)
on conflict (id) do nothing;
