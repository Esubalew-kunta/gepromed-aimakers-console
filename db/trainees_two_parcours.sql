-- ============================================================================
-- Phase 1 — Trainee two-parcours migration.
-- Makes the two participant pipelines persistable and adds the SOP fields.
--   • HelpMeSee : lead → enrollment_form → dates_validation → invoice →
--                 elearning_check → simulator_access → confirmed → done
--   • Bootcamp  : lead → prerequisites → pre_registration → deposit_contract →
--                 practical_info → elearning_sent → confirmed → deposit_refunded → done
--
-- SAFE + IDEMPOTENT — re-runnable. Everything is additive EXCEPT the one
-- in-place change `leads.stage` enum → text (+ CHECK), and existing rows are
-- backfilled to valid new values BEFORE the CHECK is added.
-- Project: hdvqiiprylrrzrkydtpa. Run in the Supabase SQL editor or as a migration.
-- (The DB table stays named `leads`; only the console UI/route is "Trainees".)
-- ============================================================================

begin;

-- 1) TRAININGS — program_type (drives parcours) + sponsor fields --------------
alter table trainings add column if not exists program_type text not null default 'bootcamp';
alter table trainings add column if not exists is_sponsored boolean not null default false;
alter table trainings add column if not exists sponsors jsonb not null default '[]';

alter table trainings drop constraint if exists trainings_program_type_valid;
alter table trainings add constraint trainings_program_type_valid
  check (program_type in ('helpmesee','bootcamp','workshop'));

-- Best-effort seed of program_type: ophthalmology (cataract) = HelpMeSee, else
-- Bootcamp. Only rewrites rows still at the default, so manual edits survive re-runs.
update trainings
  set program_type = case when specialty = 'ophthalmology' then 'helpmesee' else 'bootcamp' end
  where program_type = 'bootcamp';

-- 2) LEADS — parcours discriminator ------------------------------------------
alter table leads add column if not exists parcours text not null default 'bootcamp';

-- 3) LEADS — per-stage timestamps (both parcours) ----------------------------
alter table leads add column if not exists enrollment_form_at    timestamptz;
alter table leads add column if not exists dates_validated_at     timestamptz;
alter table leads add column if not exists invoice_paid_at        timestamptz;
alter table leads add column if not exists elearning_checked_at   timestamptz;
alter table leads add column if not exists simulator_access_at    timestamptz;
alter table leads add column if not exists prerequisites_ok_at    timestamptz;
alter table leads add column if not exists pre_registration_at    timestamptz;
alter table leads add column if not exists deposit_contract_at    timestamptz;
alter table leads add column if not exists practical_info_at      timestamptz;
alter table leads add column if not exists elearning_sent_at      timestamptz;
alter table leads add column if not exists deposit_refunded_at    timestamptz;
alter table leads add column if not exists done_at                timestamptz;
alter table leads add column if not exists not_interested_at      timestamptz;

-- 4) LEADS — SOP business-rule fields ----------------------------------------
alter table leads add column if not exists caution_waived          boolean not null default false;
alter table leads add column if not exists attended                boolean;              -- refund gate (null until known)
alter table leads add column if not exists attendance_confirmed_at timestamptz;
alter table leads add column if not exists elearning_completed     boolean not null default false;
alter table leads add column if not exists year_of_residency       text;

-- 5) LEADS — backfill parcours from the linked training ----------------------
-- Workshops share the Bootcamp stage set, so map workshop → bootcamp.
update leads l
  set parcours = case when t.program_type = 'helpmesee' then 'helpmesee' else 'bootcamp' end
  from trainings t
  where l.training_id = t.id
    and l.parcours = 'bootcamp';          -- only rows still at the default

alter table leads drop constraint if exists leads_parcours_valid;
alter table leads add constraint leads_parcours_valid check (parcours in ('helpmesee','bootcamp'));

-- 6) LEADS.stage — enum → text (+ CHECK). Backfill legacy values FIRST -------
-- The seat-count trigger fires "after update of stage", so it pins the column
-- type. Drop it around the conversion and recreate it afterwards (its function
-- bump_enrolled() is unchanged and its 'confirmed' comparison works on text).
drop trigger if exists trg_bump_enrolled on leads;
alter table leads alter column stage drop default;
alter table leads alter column stage type text using stage::text;
alter table leads alter column stage set default 'lead';

-- old single pipeline (lead / deposit_paid / contract_signed / confirmed) →
-- new bootcamp stages; carry the matching timestamps.
update leads set stage = 'pre_registration' where stage = 'deposit_paid';
update leads set stage = 'deposit_contract' where stage = 'contract_signed';
update leads set pre_registration_at = coalesce(pre_registration_at, deposit_paid_at)
  where deposit_paid_at is not null;
update leads set deposit_contract_at = coalesce(deposit_contract_at, contract_signed_at)
  where contract_signed_at is not null;

alter table leads drop constraint if exists leads_stage_valid;
alter table leads add constraint leads_stage_valid check (stage in (
  -- shared
  'lead','confirmed','done',
  -- HelpMeSee
  'enrollment_form','dates_validation','invoice','elearning_check','simulator_access',
  -- Bootcamp / Workshop
  'prerequisites','pre_registration','deposit_contract','practical_info','elearning_sent','deposit_refunded'
));

-- recreate the seat-count trigger dropped above (unchanged definition)
drop trigger if exists trg_bump_enrolled on leads;
create trigger trg_bump_enrolled after update of stage on leads
  for each row execute function bump_enrolled();

create index if not exists leads_parcours_idx on leads (parcours);

-- 7) create_lead() — set parcours from the training's program_type -----------
--    (the website's only write path; keeps anon insert + returns the ref)
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
    dietary, arrival, needs_accommodation, elearning_access, notes
  ) values (
    v_training, v_title, v_parcours,
    payload->>'firstName', payload->>'lastName', payload->>'email',
    coalesce(payload->>'phone', ''), coalesce(payload->>'profession', ''),
    coalesce(payload->>'institution', ''), coalesce(payload->>'country', ''),
    coalesce(payload->>'dietary', ''), coalesce(payload->>'arrival', ''),
    coalesce((payload->>'needsAccommodation')::boolean, false),
    coalesce((payload->>'elearningAccess')::boolean, true),
    coalesce(payload->>'notes', '')
  )
  returning ref into v_ref;

  return v_ref;
end;
$$;

grant execute on function create_lead(jsonb) to anon, authenticated;

commit;

-- Post-check (run separately to eyeball the result):
--   select stage, parcours, count(*) from leads group by 1,2 order by 1,2;
--   select program_type, count(*) from trainings group by 1;
