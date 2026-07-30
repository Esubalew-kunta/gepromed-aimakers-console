-- ============================================================================
-- Trainee document upload v2 — signed contract AND payment-receipt screenshot,
-- both submitted by the trainee via the public /sign?ref=... link, landing on
-- the lead's pipeline card for staff to review and confirm.
--
-- Before this: submit_signed_document() only handled a single, contract-only
-- document, and its stage-advance logic still referenced 'contract_signed' /
-- 'deposit_paid' — stage names from BEFORE the trainees_two_parcours.sql
-- migration renamed the bootcamp pipeline. Those values aren't in
-- leads_stage_valid anymore, so calling this RPC today would raise a check
-- constraint violation. This migration also fixes that latent bug.
--
-- Run in the Supabase SQL editor (project aablleekwyjqdxsscyeo).
-- SAFE + IDEMPOTENT — re-runnable.
-- ============================================================================
begin;

-- 1. Discriminate what a document actually is. Existing rows are all
--    contract uploads (the only kind that existed before), so backfill 'contract'.
alter table documents add column if not exists kind text not null default 'contract';
alter table documents drop constraint if exists documents_kind_valid;
alter table documents add constraint documents_kind_valid check (kind in ('contract', 'payment_receipt'));

-- 2. Replace the broken 2-arg RPC with a 3-arg version (kind, default
-- 'contract' so any external caller still on the old signature keeps
-- working). Drop first since changing the default parameter list would
-- otherwise leave the old (text, text) overload in place, ambiguous with
-- 2-arg calls against the new default-arg version.
drop function if exists submit_signed_document(text, text);
drop function if exists submit_signed_document(text, text, text);

create or replace function submit_signed_document(p_ref text, p_path text, p_kind text default 'contract')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead uuid;
  v_stage text;
  v_parcours text;
begin
  if p_kind not in ('contract', 'payment_receipt') then
    raise exception 'Invalid document kind.';
  end if;

  select id, stage, parcours into v_lead, v_stage, v_parcours from leads where ref = p_ref;
  if v_lead is null then
    raise exception 'Unknown reference.';
  end if;

  insert into documents (lead_id, file_url, sign_channel, signed, verified, kind)
  values (v_lead, p_path, 'manual', true, false, p_kind);

  -- Move the bootcamp lead to "deposit_contract" (caution/contrat reçus,
  -- pending staff verification) the first time the signed contract comes in.
  -- A payment-receipt-only upload doesn't advance the stage on its own —
  -- staff confirm once BOTH documents are present (see verify_and_confirm_step
  -- in the console app). HelpMeSee has no contract/deposit step at all.
  if p_kind = 'contract' and v_parcours = 'bootcamp' and v_stage in ('prerequisites', 'pre_registration') then
    update leads
    set sign_channel = 'manual',
        stage = 'deposit_contract',
        deposit_contract_at = now()
    where id = v_lead;
  end if;

  insert into lead_events (lead_id, type, payload)
  values (v_lead, 'document:uploaded', jsonb_build_object('channel', 'online', 'kind', p_kind));

  return jsonb_build_object('ok', true, 'ref', p_ref, 'kind', p_kind);
end;
$$;

grant execute on function submit_signed_document(text, text, text) to anon, authenticated;

commit;
