-- ============================================================================
-- Third Qualiopi content pass (client response 2026-07-16, points 6/7): two
-- checklist items had no home yet on the PUBLIC training page (the PDF/
-- workbook side already covers them via the Fiche "Inscription"/"Tarifs"
-- rows in programs/route.ts) — registration process/deadlines, and price as
-- free text (or funder name when third-party funded). Safe to re-run.
-- ============================================================================

alter table trainings add column if not exists registration_info jsonb; -- {fr,en} process + deadlines
alter table trainings add column if not exists price_note jsonb;        -- {fr,en} free-text price/costs/discounts
