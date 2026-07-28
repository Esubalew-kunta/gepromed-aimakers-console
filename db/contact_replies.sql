-- ============================================================================
-- Full reply history for contact_messages (one row per staff reply, not just
-- the latest). Run AFTER contact_messages.sql. SAFE + IDEMPOTENT.
-- ============================================================================

begin;

create table if not exists contact_replies (
  id                 uuid primary key default gen_random_uuid(),
  contact_message_id uuid not null references contact_messages(id) on delete cascade,
  body               text not null,
  sent_at            timestamptz not null default now()
);

create index if not exists contact_replies_message_idx on contact_replies (contact_message_id, sent_at desc);

-- Staff-only (console via service_role bypasses RLS entirely; this policy
-- covers any direct authenticated access).
alter table contact_replies enable row level security;
drop policy if exists contact_replies_staff_all on contact_replies;
create policy contact_replies_staff_all on contact_replies for all to authenticated using (true) with check (true);

commit;
