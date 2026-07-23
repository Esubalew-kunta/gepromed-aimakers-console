-- ============================================================================
-- Reusable sponsor library (client response pt. 4 & 5).
-- A sponsor is authored once (logo + name + optional website) and then picked
-- for any training. Trainings still store the SELECTED sponsors denormalized in
-- trainings.sponsors (jsonb) so the public site reads them unchanged; this table
-- is the pick-list that makes them reusable.
--
-- NOTE: this table already existed in project hdvqiiprylrrzrkydtpa (created
-- 2026-07-22, 3 rows). This file documents that exact shape and is a no-op there
-- (create if not exists). Column is `website_url` (not `website`); there is no
-- `created_by`. The app (/api/sponsors) matches this schema.
-- SAFE + IDEMPOTENT.
-- ============================================================================

create table if not exists public.sponsors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text not null,           -- public URL in the sponsor-logos bucket
  website_url text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists sponsors_name_idx on public.sponsors (lower(name));

-- Public bucket for sponsor logos so the website can render them.
insert into storage.buckets (id, name, public)
values ('sponsor-logos', 'sponsor-logos', true)
on conflict (id) do nothing;
