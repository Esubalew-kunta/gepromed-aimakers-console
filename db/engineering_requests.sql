-- ============================================================================
-- Phase 5 — Engineering pipelines (Explant Analysis / Test Platform / Equipment
-- Rental) backing table. One table, discriminated by `kind` (+ `variant` for the
-- two explant cases). Stages are validated against the union of all 3 pipelines'
-- stage sets (src/lib/pipeline/engineering.ts). SAFE + IDEMPOTENT.
-- Project: hdvqiiprylrrzrkydtpa. Run in the SQL editor or as a migration.
-- ============================================================================

begin;

create table if not exists engineering_requests (
  id               uuid primary key default gen_random_uuid(),
  ref              text unique,
  kind             text not null check (kind in ('explant','test','equipment')),
  variant          text check (variant in ('hospital','industrial','default')),
  stage            text not null default 'request',
  requester_name   text not null,
  requester_email  text not null,
  institution      text default '',
  org_type         text default '',          -- surgeon | CHU | industrial | ...
  desired_date     date,                      -- equipment rental slot
  notes            text default '',
  meta             jsonb not null default '{}',
  reminders_active boolean not null default true,
  exit_reason      text,
  exited_at        timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Validate stage against the union of the 3 pipelines' stages.
alter table engineering_requests drop constraint if exists eng_stage_valid;
alter table engineering_requests add constraint eng_stage_valid check (stage in (
  -- explant
  'prospection','formalisation','reception','first_report','complementary','follow_up',
  -- test
  'request','qualified','quote','order','execution','report',
  -- equipment
  'scheduled','habilitation','completed',
  -- shared terminal
  'done'
));

create index if not exists eng_kind_stage_idx on engineering_requests (kind, stage);

-- human ref ENG-000001
create sequence if not exists eng_ref_seq;
create or replace function set_eng_ref() returns trigger as $$
begin
  if new.ref is null then
    new.ref := 'ENG-' || to_char(nextval('eng_ref_seq'), 'FM000000');
  end if;
  return new;
end; $$ language plpgsql;
drop trigger if exists trg_set_eng_ref on engineering_requests;
create trigger trg_set_eng_ref before insert on engineering_requests
  for each row execute function set_eng_ref();

-- updated_at bump (reuse the shared function from schema.sql)
drop trigger if exists trg_touch_eng on engineering_requests;
create trigger trg_touch_eng before update on engineering_requests
  for each row execute function touch_updated_at();

-- Public website intake (anon) — the only anon write path; sets the initial
-- stage per kind and returns the ref.
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
begin
  if v_kind not in ('explant','test','equipment') then
    raise exception 'Invalid kind.';
  end if;
  if coalesce(payload->>'name', '') = '' or coalesce(payload->>'email', '') = '' then
    raise exception 'Missing required fields (name, email).';
  end if;
  v_stage := case when v_kind = 'explant' then 'prospection' else 'request' end;

  insert into engineering_requests (
    kind, variant, stage, requester_name, requester_email,
    institution, org_type, desired_date, notes, meta
  ) values (
    v_kind,
    nullif(payload->>'variant', ''),
    v_stage,
    payload->>'name', payload->>'email',
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

-- RLS: anon may INSERT (via the RPC / direct); staff manage. service_role bypasses.
alter table engineering_requests enable row level security;
drop policy if exists eng_anon_insert on engineering_requests;
create policy eng_anon_insert on engineering_requests for insert to anon with check (true);
drop policy if exists eng_staff_read on engineering_requests;
create policy eng_staff_read on engineering_requests for select to authenticated using (true);
drop policy if exists eng_staff_update on engineering_requests;
create policy eng_staff_update on engineering_requests for update to authenticated using (true) with check (true);
drop policy if exists eng_staff_delete on engineering_requests;
create policy eng_staff_delete on engineering_requests for delete to authenticated using (true);

commit;
