-- ============================================================================
-- Add IP-based rate limiting alongside the existing per-email limit
-- (rate_limit_public_rpcs.sql). Email-only limiting has a hole: a script
-- rotating through fake/random email addresses gets a fresh quota every
-- call. This closes that by also capping how many times the SAME NETWORK
-- can hit each RPC in an hour, regardless of what email it claims.
--
-- Confirmed empirically (temporary debug_request_headers() RPC, since
-- removed) that Supabase's PostgREST exposes the caller's real IP via
-- current_setting('request.headers', true) as both cf-connecting-ip and
-- x-forwarded-for on this project — safe to rely on.
--
-- A small dedicated log table (rpc_rate_limit) tracks attempts by IP per
-- RPC "bucket", separate from the business tables (leads/etc.) so this is
-- a purely operational concern, not mixed into trainee/request data.
-- Idempotent: safe to re-run. Project: hdvqiiprylrrzrkydtpa.
-- ============================================================================

create table if not exists rpc_rate_limit (
  id         bigint generated always as identity primary key,
  bucket     text not null,
  ip_key     text not null,
  created_at timestamptz not null default now()
);
create index if not exists rpc_rate_limit_lookup_idx
  on rpc_rate_limit (bucket, ip_key, created_at);

-- Old attempts are pure noise after their window closes; keeps the table
-- from growing forever without needing a cron job.
create or replace function prune_rpc_rate_limit() returns void
language sql as $$
  delete from rpc_rate_limit where created_at < now() - interval '2 hours';
$$;

-- Best-effort caller IP: cf-connecting-ip (Cloudflare's own header, set
-- from the actual TCP connection — not client-suppliable) first, falling
-- back to the first hop of x-forwarded-for. Returns null (never throws) if
-- request.headers isn't available for some reason, so callers must treat a
-- null IP as "can't rate-limit by IP this time" rather than fail closed.
create or replace function current_client_ip() returns text
language plpgsql
stable
as $$
declare
  v_headers jsonb;
  v_ip text;
begin
  begin
    v_headers := current_setting('request.headers', true)::jsonb;
  exception when others then
    return null;
  end;
  if v_headers is null then
    return null;
  end if;
  v_ip := v_headers->>'cf-connecting-ip';
  if v_ip is null or v_ip = '' then
    v_ip := split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1);
  end if;
  return nullif(trim(v_ip), '');
end;
$$;

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
  v_ip       text;
  v_recent_ip int;
begin
  if coalesce(payload->>'firstName', '') = ''
     or coalesce(payload->>'lastName', '') = ''
     or coalesce(v_email, '') = '' then
    raise exception 'Missing required fields (first name, last name, email).';
  end if;

  v_ip := current_client_ip();
  if v_ip is not null then
    select count(*) into v_recent_ip
    from rpc_rate_limit
    where bucket = 'create_lead' and ip_key = v_ip and created_at > now() - interval '1 hour';
    if v_recent_ip >= 15 then
      raise exception 'Too many requests from this network. Please try again later.';
    end if;
    insert into rpc_rate_limit (bucket, ip_key) values ('create_lead', v_ip);
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
  v_ip     text;
  v_recent_ip int;
begin
  if v_kind not in ('explant','test','equipment') then
    raise exception 'Invalid kind.';
  end if;
  if coalesce(payload->>'name', '') = '' or coalesce(v_email, '') = '' then
    raise exception 'Missing required fields (name, email).';
  end if;

  v_ip := current_client_ip();
  if v_ip is not null then
    select count(*) into v_recent_ip
    from rpc_rate_limit
    where bucket = 'create_engineering_request' and ip_key = v_ip and created_at > now() - interval '1 hour';
    if v_recent_ip >= 15 then
      raise exception 'Too many requests from this network. Please try again later.';
    end if;
    insert into rpc_rate_limit (bucket, ip_key) values ('create_engineering_request', v_ip);
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
  v_ip     text;
  v_recent_ip int;
begin
  if coalesce(payload->>'name', '') = '' or coalesce(v_email, '') = ''
     or coalesce(payload->>'message', '') = '' then
    raise exception 'Missing required fields (name, email, message).';
  end if;

  v_ip := current_client_ip();
  if v_ip is not null then
    select count(*) into v_recent_ip
    from rpc_rate_limit
    where bucket = 'create_contact_message' and ip_key = v_ip and created_at > now() - interval '1 hour';
    if v_recent_ip >= 8 then
      raise exception 'Too many requests from this network. Please try again later.';
    end if;
    insert into rpc_rate_limit (bucket, ip_key) values ('create_contact_message', v_ip);
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
