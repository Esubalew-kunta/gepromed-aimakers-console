-- ============================================================================
-- Restore the HelpMeSee "Enrollment form" step (7 -> 8 stages).
-- Client confirmed (2026-07-16) this step is required: HelpMeSee's own
-- enrollment form is relayed by hand (Gepromed -> trainee -> Gepromed ->
-- HelpMeSee), not redundant with the private referral form. Reverses
-- db/helpmesee_remove_enrollment_form.sql. SAFE + IDEMPOTENT.
-- Project: hdvqiiprylrrzrkydtpa.
-- ============================================================================

-- Re-add enrollment_form to the allowed-stages constraint.
alter table leads drop constraint if exists leads_stage_valid;
alter table leads add constraint leads_stage_valid check (stage in (
  -- shared
  'lead','confirmed','done',
  -- HelpMeSee (enrollment_form restored)
  'enrollment_form','dates_validation','invoice','elearning_check','simulator_access',
  -- Bootcamp / Workshop
  'prerequisites','pre_registration','deposit_contract','practical_info','elearning_sent','deposit_refunded'
));

-- No data backfill needed: leads currently on dates_validation stay there
-- (we don't retroactively move anyone backwards into enrollment_form).
