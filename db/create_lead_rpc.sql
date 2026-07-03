-- ============================================================================
-- create_lead(): the public website's ONLY write path into leads.
-- SECURITY DEFINER so the anon (publishable) key can insert a lead and get the
-- ref back — even though anon has no SELECT on leads (RLS). Run in the SQL
-- editor of project aablleekwyjqdxsscyeo.
-- ============================================================================

create or replace function create_lead(payload jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_training uuid;
  v_title    text;
  v_ref      text;
begin
  if coalesce(payload->>'firstName', '') = ''
     or coalesce(payload->>'lastName', '') = ''
     or coalesce(payload->>'email', '') = '' then
    raise exception 'Missing required fields (first name, last name, email).';
  end if;

  select id, title->>'fr' into v_training, v_title
  from trainings
  where slug = payload->>'sessionSlug';

  if v_training is null then
    raise exception 'Unknown session.';
  end if;

  insert into leads (
    training_id, training_title_snapshot,
    first_name, last_name, email, phone, profession, institution, country,
    dietary, arrival, needs_accommodation, elearning_access, notes
  ) values (
    v_training, v_title,
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

-- Public site (anon) + staff (authenticated) may call it. Nothing else on
-- leads is exposed to anon.
grant execute on function create_lead(jsonb) to anon, authenticated;
