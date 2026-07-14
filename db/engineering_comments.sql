-- ============================================================================
-- Phase 4 (Engineering parity) — staff comments on engineering requests.
-- Mirrors `lead_comments` (schema.sql) for the trainee pipeline. SAFE + IDEMPOTENT.
-- Project: hdvqiiprylrrzrkydtpa. Run in the SQL editor or as a migration.
-- ============================================================================

begin;

create table if not exists engineering_comments (
  id                     uuid primary key default gen_random_uuid(),
  engineering_request_id uuid not null references engineering_requests(id) on delete cascade,
  author                 text,                       -- logged-in staff name/email
  body                   text not null,
  created_at             timestamptz not null default now()
);

create index if not exists eng_comments_request_idx
  on engineering_comments (engineering_request_id, created_at);

-- RLS: staff (authenticated) manage; service_role bypasses. No anon access.
alter table engineering_comments enable row level security;
drop policy if exists eng_comments_staff on engineering_comments;
create policy eng_comments_staff on engineering_comments
  for all to authenticated using (true) with check (true);

commit;
