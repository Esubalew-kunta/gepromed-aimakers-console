-- ============================================================================
-- Second Qualiopi content pass (client response 2026-07-16, points 6/7): the
-- PDF program + public detail page must both show accessibility info + a
-- NAMED disability-referent contact, and the certificate/attestation
-- delivered. Max participants and trainer name/title are already covered by
-- existing columns (capacity, supervisors jsonb) — no new column needed for
-- those. Extends db/course_qualiopi_fields.sql. Safe to re-run.
-- ============================================================================

alter table trainings add column if not exists accessibility_info jsonb;       -- {fr,en} free text
alter table trainings add column if not exists accessibility_referent text;    -- named contact person
alter table trainings add column if not exists certificate_delivered jsonb;    -- {fr,en} free text
