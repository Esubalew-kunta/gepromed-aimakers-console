-- ============================================================================
-- Training-level sponsor detail (client response 2026-07-16).
-- Funding/sponsorship was ALREADY training-level (trainees_two_parcours.sql:
-- trainings.is_sponsored bool + trainings.sponsors jsonb array), which matches
-- the client's confirmation that sponsorship is set once per training, never
-- per registrant. This migration only enriches the shape the client asked
-- for: sponsor name/logo/website/optional referent contact.
--
-- `sponsors` stays a jsonb array (supports multiple co-sponsors), each item
-- now documented as:
--   { name: string, logoUrl?: string, website?: string, referentName?: string }
-- No column/type change needed (jsonb is schemaless) — this file is a no-op
-- against the DB, kept only to document the shape for app code.
-- SAFE + IDEMPOTENT. Project: hdvqiiprylrrzrkydtpa.
-- ============================================================================

select 1; -- intentionally a no-op; see comment above
