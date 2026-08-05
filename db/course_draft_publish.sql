-- ============================================================================
-- Draft / publish workflow for trainings.
--
-- Previously a course went live on the public site the instant "Create
-- course" was clicked — no draft state, no review step. Adds
-- is_published (default FALSE for new rows), and — critically — enforces
-- it at the RLS layer, not just by filtering in gepromed-web's queries.
-- Same principle as the anon-RPC rate limiting done earlier this session:
-- the public anon key can query trainings directly (curl, anything), so
-- "unpublished courses are hidden" has to be a database guarantee, not a
-- client-side convention the web app's code happens to follow.
--
-- Existing trainings are backfilled to is_published = true in the same
-- migration — they're already live and must stay that way; only courses
-- created from this point on start as drafts.
--
-- Idempotent: safe to re-run. Project: hdvqiiprylrrzrkydtpa.
-- ============================================================================

alter table trainings add column if not exists is_published boolean not null default false;

-- One-time backfill, guarded so a later re-run of this migration can never
-- un-draft a genuine draft created after this first ran: only backfill if
-- NO row is published yet, i.e. this is the very first time the column
-- exists with real data (every training that existed before this migration
-- was already publicly visible — there was no draft concept before — so it
-- must stay visible now that the flag is enforced).
do $$
begin
  if not exists (select 1 from trainings where is_published = true) then
    update trainings set is_published = true;
  end if;
end $$;

drop policy if exists trainings_public_read on trainings;
create policy trainings_public_read on trainings for select using (is_published = true);
