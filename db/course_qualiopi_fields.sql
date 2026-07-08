-- ============================================================================
-- Qualiopi course fields: adds the structured "public visé" + RNQ blocks that
-- the public website training detail pages now render (prérequis, ressources
-- pédagogiques, méthodes d'enseignement / d'évaluation, organisation).
-- Run in the Supabase SQL editor. Safe to re-run (IF NOT EXISTS).
-- Bilingual blocks are stored as jsonb { "fr": "...", "en": "..." }.
-- target_audience is a jsonb array of short tags (e.g. ["Internes","IBODE"]).
-- ============================================================================

alter table trainings add column if not exists target_audience jsonb default '[]'::jsonb;
alter table trainings add column if not exists prerequisites jsonb;
alter table trainings add column if not exists pedagogical_resources jsonb;
alter table trainings add column if not exists teaching_methods jsonb;
alter table trainings add column if not exists evaluation_methods jsonb;
alter table trainings add column if not exists supervision_organization jsonb;
