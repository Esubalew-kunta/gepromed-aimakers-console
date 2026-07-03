-- ============================================================================
-- Make "runs this month" real: tag each skill_run with the skill's key so we
-- can count runs per skill without a uuid lookup. Run in the SQL editor.
-- ============================================================================

alter table skill_runs add column if not exists skill_key text;
create index if not exists skill_runs_key_created_idx
  on skill_runs (skill_key, created_at);
