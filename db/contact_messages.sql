-- ============================================================================
-- Contact messages (public "Contact us" form on the website). Mirrors the
-- leads / engineering_requests pattern: anon inserts via a SECURITY DEFINER
-- RPC, staff (console, via service_role) reads/updates/deletes. SAFE + IDEMPOTENT.
-- Run in the Supabase SQL editor or as a migration.
-- ============================================================================

begin;

create table if not exists contact_messages (
  id         uuid primary key default gen_random_uuid(),
  ref        text unique,
  name       text not null,
  email      text not null,
  subject    text default '',
  message    text not null,
  status     text not null default 'new' check (status in ('new', 'read', 'archived')),
  replied_at timestamptz,       -- set when staff sends a reply from the console
  last_reply text,              -- body of the most recent reply, for the "Replied" panel
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table contact_messages add column if not exists replied_at timestamptz;
alter table contact_messages add column if not exists last_reply text;

create index if not exists contact_messages_status_idx on contact_messages (status, created_at desc);

-- human ref MSG-000001
create sequence if not exists contact_ref_seq;
create or replace function set_contact_ref() returns trigger as $$
begin
  if new.ref is null then
    new.ref := 'MSG-' || to_char(nextval('contact_ref_seq'), 'FM000000');
  end if;
  return new;
end; $$ language plpgsql;
drop trigger if exists trg_set_contact_ref on contact_messages;
create trigger trg_set_contact_ref before insert on contact_messages
  for each row execute function set_contact_ref();

-- updated_at bump (reuse the shared function from schema.sql)
drop trigger if exists trg_touch_contact on contact_messages;
create trigger trg_touch_contact before update on contact_messages
  for each row execute function touch_updated_at();

-- Public website intake (anon) — the only anon write path; returns the ref.
create or replace function create_contact_message(payload jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
begin
  if coalesce(payload->>'name', '') = '' or coalesce(payload->>'email', '') = ''
     or coalesce(payload->>'message', '') = '' then
    raise exception 'Missing required fields (name, email, message).';
  end if;

  insert into contact_messages (name, email, subject, message)
  values (
    payload->>'name',
    payload->>'email',
    coalesce(payload->>'subject', ''),
    payload->>'message'
  )
  returning ref into v_ref;

  return v_ref;
end;
$$;
grant execute on function create_contact_message(jsonb) to anon, authenticated;

-- RLS: anon may INSERT (via the RPC only); staff manage. service_role bypasses.
alter table contact_messages enable row level security;
drop policy if exists contact_anon_insert on contact_messages;
create policy contact_anon_insert on contact_messages for insert to anon with check (true);
drop policy if exists contact_staff_read on contact_messages;
create policy contact_staff_read on contact_messages for select to authenticated using (true);
drop policy if exists contact_staff_update on contact_messages;
create policy contact_staff_update on contact_messages for update to authenticated using (true) with check (true);
drop policy if exists contact_staff_delete on contact_messages;
create policy contact_staff_delete on contact_messages for delete to authenticated using (true);

commit;
