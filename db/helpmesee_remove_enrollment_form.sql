-- ============================================================================
-- Remove the HelpMeSee "Enrollment form" step (8 -> 7 stages).
-- The private referral form already creates the Trainee, so the separate
-- foundation enrollment-form checkpoint was redundant (see CLIENT_QUESTIONS Q4).
-- SAFE + IDEMPOTENT. Project: hdvqiiprylrrzrkydtpa. (Applied via MCP.)
-- ============================================================================

-- Move any trainee currently on enrollment_form to the next step.
update leads
  set stage = 'dates_validation',
      dates_validated_at = coalesce(dates_validated_at, enrollment_form_at, now())
  where stage = 'enrollment_form';

-- Drop enrollment_form from the allowed-stages constraint.
alter table leads drop constraint if exists leads_stage_valid;
alter table leads add constraint leads_stage_valid check (stage in (
  -- shared
  'lead','confirmed','done',
  -- HelpMeSee (enrollment_form removed)
  'dates_validation','invoice','elearning_check','simulator_access',
  -- Bootcamp / Workshop
  'prerequisites','pre_registration','deposit_contract','practical_info','elearning_sent','deposit_refunded'
));
