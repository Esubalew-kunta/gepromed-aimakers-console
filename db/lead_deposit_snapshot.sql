-- ============================================================================
-- Snapshot the deposit amount onto each lead at registration, so the welcome
-- email can show it without a second lookup. Run in the SQL editor of
-- project aablleekwyjqdxsscyeo. Re-running is safe.
-- ============================================================================

alter table leads add column if not exists deposit_eur numeric;

-- Recreate create_lead to also snapshot the training's deposit amount.
create or replace function create_lead(payload jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_training uuid;
  v_title    text;
  v_deposit  numeric;
  v_ref      text;
begin
  if coalesce(payload->>'firstName', '') = ''
     or coalesce(payload->>'lastName', '') = ''
     or coalesce(payload->>'email', '') = '' then
    raise exception 'Missing required fields (first name, last name, email).';
  end if;

  select id, title->>'fr', deposit_eur
    into v_training, v_title, v_deposit
  from trainings
  where slug = payload->>'sessionSlug';

  if v_training is null then
    raise exception 'Unknown session.';
  end if;

  insert into leads (
    training_id, training_title_snapshot, deposit_eur,
    first_name, last_name, email, phone, profession, institution, country,
    dietary, arrival, needs_accommodation, elearning_access, notes
  ) values (
    v_training, v_title, v_deposit,
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

-- Backfill existing leads that predate this column.
update leads l
set deposit_eur = t.deposit_eur
from trainings t
where l.training_id = t.id and l.deposit_eur is null;
