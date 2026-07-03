-- ============================================================================
-- Course images: a per-course image_url + a PUBLIC storage bucket to hold the
-- uploaded files. Run in the SQL editor of project aablleekwyjqdxsscyeo.
-- (SaaS uploads via the service_role key, which bypasses storage RLS; the
--  bucket is public so the website can render the images.)
-- ============================================================================

alter table trainings add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('course-images', 'course-images', true)
on conflict (id) do nothing;
