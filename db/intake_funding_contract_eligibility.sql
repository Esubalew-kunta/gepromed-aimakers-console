-- ============================================================================
-- Participant intake + background-action migration.
--   A) Per-lead funding / sponsor / foundation / eligibility fields (fed by the
--      public register form + private HelpMeSee form).
--   B) Normalize any leftover legacy stages (deposit_paid / contract_signed).
--   C) Engagement-contract templates + a default row.
--   D) leads.contract_template_id + an auto-attach trigger that fires on the
--      CURRENT bootcamp stages (the old trigger fired on the retired
--      'deposit_paid' stage, so contracts stopped attaching).
--   E) create_lead(): persist the new funding/sponsor/foundation fields.
-- SAFE + IDEMPOTENT — re-runnable. Project: hdvqiiprylrrzrkydtpa.
-- ============================================================================

-- A) per-lead funding / sponsor / foundation / eligibility -------------------
alter table leads add column if not exists funding text not null default 'self';
alter table leads add column if not exists sponsor_name text;
alter table leads add column if not exists sponsor_contact text;
alter table leads add column if not exists sponsor_logo_url text;
alter table leads add column if not exists helpmesee_ref text;
alter table leads add column if not exists coordinator text;
alter table leads add column if not exists eligibility_note text;
alter table leads add column if not exists eligibility_checked_at timestamptz;
alter table leads drop constraint if exists leads_funding_valid;
alter table leads add constraint leads_funding_valid check (funding in ('self','sponsored'));

-- B) normalize leftover legacy single-pipeline stages ------------------------
update leads set stage='pre_registration',
    pre_registration_at = coalesce(pre_registration_at, deposit_paid_at, now())
  where stage='deposit_paid';
update leads set stage='deposit_contract',
    deposit_contract_at = coalesce(deposit_contract_at, contract_signed_at, now())
  where stage='contract_signed';

-- C) engagement-contract templates + a default row ---------------------------
create table if not exists contract_templates (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  file_url   text,
  is_default boolean not null default false,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
insert into contract_templates (name, is_default, active)
  select 'Contrat d''engagement — standard 2026', true, true
  where not exists (select 1 from contract_templates where is_default);

-- D) leads.contract_template_id + auto-attach on the CURRENT stages ----------
alter table leads add column if not exists contract_template_id uuid references contract_templates(id);
alter table leads add column if not exists contract_attached_at timestamptz;

create or replace function auto_attach_contract() returns trigger
language plpgsql as $$
begin
  -- Attach the default engagement contract the moment a Bootcamp lead reaches
  -- the pré-inscription / caution step, if none is attached yet.
  if new.stage in ('pre_registration','deposit_contract')
     and old.stage is distinct from new.stage
     and new.contract_template_id is null then
    new.contract_template_id :=
      (select id from contract_templates where is_default and active order by created_at limit 1);
    new.contract_attached_at := now();
  end if;
  return new;
end; $$;

drop trigger if exists trg_auto_contract on leads;
create trigger trg_auto_contract before update on leads
  for each row execute function auto_attach_contract();

-- E) create_lead(): keep parcours derivation, add funding/sponsor/foundation -
create or replace function create_lead(payload jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_training uuid;
  v_title    text;
  v_ptype    text;
  v_parcours text;
  v_ref      text;
begin
  if coalesce(payload->>'firstName', '') = ''
     or coalesce(payload->>'lastName', '') = ''
     or coalesce(payload->>'email', '') = '' then
    raise exception 'Missing required fields (first name, last name, email).';
  end if;

  select id, title->>'fr', program_type
    into v_training, v_title, v_ptype
  from trainings
  where slug = payload->>'sessionSlug';

  if v_training is null then
    raise exception 'Unknown session.';
  end if;

  v_parcours := case when v_ptype = 'helpmesee' then 'helpmesee' else 'bootcamp' end;

  insert into leads (
    training_id, training_title_snapshot, parcours,
    first_name, last_name, email, phone, profession, institution, country,
    dietary, arrival, needs_accommodation, elearning_access, notes,
    funding, sponsor_name, sponsor_contact, sponsor_logo_url,
    helpmesee_ref, coordinator
  ) values (
    v_training, v_title, v_parcours,
    payload->>'firstName', payload->>'lastName', payload->>'email',
    coalesce(payload->>'phone', ''), coalesce(payload->>'profession', ''),
    coalesce(payload->>'institution', ''), coalesce(payload->>'country', ''),
    coalesce(payload->>'dietary', ''), coalesce(payload->>'arrival', ''),
    coalesce((payload->>'needsAccommodation')::boolean, false),
    coalesce((payload->>'elearningAccess')::boolean, true),
    coalesce(payload->>'notes', ''),
    case when payload->>'funding' = 'sponsored' then 'sponsored' else 'self' end,
    nullif(payload->>'sponsorName', ''),
    nullif(payload->>'sponsorContact', ''),
    nullif(payload->>'sponsorLogoUrl', ''),
    nullif(payload->>'helpMeSeeRef', ''),
    nullif(payload->>'coordinator', '')
  )
  returning ref into v_ref;

  return v_ref;
end;
$$;

grant execute on function create_lead(jsonb) to anon, authenticated;
