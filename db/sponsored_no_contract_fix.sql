-- ============================================================================
-- Sponsored trainings: stop auto-attaching an engagement contract.
--
-- The registration/confirmation emails were already fixed (see
-- notification_render.sql: {{registration_steps}}/{{confirmation_ack}}) to
-- tell sponsored trainees no deposit or contract is required. But
-- auto_attach_contract() (the trigger that stamps leads.contract_template_id
-- the moment a lead reaches pre_registration/deposit_contract) had no
-- funding/sponsorship check at all — it was still silently attaching a
-- contract to sponsored leads' records even though nothing was ever asked
-- of them. This migration adds the missing check.
--
-- Applied live against project hdvqiiprylrrzrkydtpa on 2026-07-20.
-- SAFE + IDEMPOTENT (create-or-replace).
-- ============================================================================

create or replace function auto_attach_contract() returns trigger
language plpgsql as $$
begin
  if new.stage in ('pre_registration','deposit_contract')
     and old.stage is distinct from new.stage
     and new.contract_template_id is null
     and not coalesce((select is_sponsored from trainings where id = new.training_id), false) then
    new.contract_template_id := coalesce(
      (select id from contract_templates
         where active and new.training_id = any(course_ids)
         order by is_default desc, created_at
         limit 1),
      (select id from contract_templates
         where is_default and active
         order by created_at
         limit 1)
    );
    if new.contract_template_id is not null then
      new.contract_attached_at := now();
    end if;
  end if;
  return new;
end; $$;
