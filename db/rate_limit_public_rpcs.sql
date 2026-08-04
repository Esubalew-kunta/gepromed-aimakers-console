-- ============================================================================
-- Rate-limit the 3 public (anon-callable) SECURITY DEFINER RPCs.
--
-- These RPCs are the website's only anon write path, but the anon key is,
-- by Supabase design, public — anyone can call create_lead /
-- create_engineering_request / create_contact_message directly (curl, a
-- script) completely bypassing the UI, with no rate limit of any kind.
-- RLS/the RPC body already constrain WHAT can be written; this adds a guard
-- on HOW MUCH one caller can write in a short window, so a script can't
-- flood the leads pipeline / engineering queue / inbox with fake rows.
--
-- Approach: reject if the same email has already submitted N+ times to that
-- table in the last hour. Keyed on email (part of every payload already) —
-- simple, needs no new table/column, and works whether or not this Supabase
-- project's PostgREST config exposes the caller's IP to functions.
-- Idempotent: create or replace function, safe to re-run.
-- Project: hdvqiiprylrrzrkydtpa. Run in the SQL editor or as a migration.
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
  v_email    text := payload->>'email';
  v_recent   int;
begin
  if coalesce(payload->>'firstName', '') = ''
     or coalesce(payload->>'lastName', '') = ''
     or coalesce(v_email, '') = '' then
    raise exception 'Missing required fields (first name, last name, email).';
  end if;

  select count(*) into v_recent
  from leads
  where email = v_email and created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'Too many requests from this email address. Please try again later.';
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
    payload->>'firstName', payload->>'lastName', v_email,
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

create or replace function create_engineering_request(payload jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind  text := payload->>'kind';
  v_stage text;
  v_ref   text;
  v_email text := payload->>'email';
  v_recent int;
begin
  if v_kind not in ('explant','test','equipment') then
    raise exception 'Invalid kind.';
  end if;
  if coalesce(payload->>'name', '') = '' or coalesce(v_email, '') = '' then
    raise exception 'Missing required fields (name, email).';
  end if;

  select count(*) into v_recent
  from engineering_requests
  where requester_email = v_email and created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'Too many requests from this email address. Please try again later.';
  end if;

  v_stage := case when v_kind = 'explant' then 'prospection' else 'request' end;

  insert into engineering_requests (
    kind, variant, stage, requester_name, requester_email,
    institution, org_type, desired_date, notes, meta
  ) values (
    v_kind,
    nullif(payload->>'variant', ''),
    v_stage,
    payload->>'name', v_email,
    coalesce(payload->>'institution', ''), coalesce(payload->>'orgType', ''),
    nullif(payload->>'desiredDate', '')::date,
    coalesce(payload->>'notes', ''),
    coalesce(payload->'meta', '{}'::jsonb)
  )
  returning ref into v_ref;

  return v_ref;
end;
$$;
grant execute on function create_engineering_request(jsonb) to anon, authenticated;

create or replace function create_contact_message(payload jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref   text;
  v_email text := payload->>'email';
  v_recent int;
begin
  if coalesce(payload->>'name', '') = '' or coalesce(v_email, '') = ''
     or coalesce(payload->>'message', '') = '' then
    raise exception 'Missing required fields (name, email, message).';
  end if;

  select count(*) into v_recent
  from contact_messages
  where email = v_email and created_at > now() - interval '1 hour';
  if v_recent >= 3 then
    raise exception 'Too many messages from this email address. Please try again later.';
  end if;

  insert into contact_messages (name, email, subject, message)
  values (
    payload->>'name',
    v_email,
    coalesce(payload->>'subject', ''),
    payload->>'message'
  )
  returning ref into v_ref;

  return v_ref;
end;
$$;
grant execute on function create_contact_message(jsonb) to anon, authenticated;
