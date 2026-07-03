-- ============================================================================
-- Gepromed — Supabase schema (the contract shared by BOTH apps)
-- Run this in the Supabase SQL editor (or as a migration) BEFORE seeding.
-- See IMPLEMENTATION_PLAN.md Appendix A for the rationale behind each field.
-- Idempotent-ish: safe to run once on a fresh project.
-- ============================================================================

-- ---------- 1. ENUMS ----------
create type lead_stage     as enum ('lead','deposit_paid','contract_signed','confirmed');
create type interest_level as enum ('highly_interested','interested','neutral','not_interested','unreachable');
create type sign_channel   as enum ('online','manual');

-- ---------- 2. TABLES ----------
create table trainings (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  title          jsonb not null,              -- {fr,en}
  specialty      text not null,               -- vascular | ophthalmology | simulation
  level          text not null,               -- Initiation | Advanced | Expert
  audience       text not null,               -- France | Europe
  city           text not null,
  venue          jsonb not null,              -- {fr,en}
  start_date     date not null,
  end_date       date not null,
  duration_days  int  not null default 1,
  price_eur      numeric not null default 0,
  deposit_eur    numeric not null default 0,
  capacity       int  not null default 0,
  enrolled       int  not null default 0,
  qualiopi       boolean not null default true,
  summary        jsonb not null,              -- {fr,en}
  objectives     jsonb not null default '[]', -- [{fr,en}]
  program        jsonb not null default '[]', -- [{day:{fr,en}, items:[{fr,en}]}]
  supervisors    jsonb not null default '[]', -- [{name, role:{fr,en}}]
  satisfaction   int,                          -- past sessions only
  pass_rate      int,
  photos         int,
  status         text not null default 'open', -- open | full  (auto via trigger)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table leads (
  id                      uuid primary key default gen_random_uuid(),
  ref                     text unique,          -- REG-000123 (trigger)
  training_id             uuid references trainings(id) on delete set null,
  training_title_snapshot text,                 -- frozen at signup
  first_name text not null,
  last_name  text not null,
  email      text not null,
  phone        text default '',
  profession   text default '',
  institution  text default '',
  country      text default '',
  dietary      text default '',
  arrival      text default '',
  needs_accommodation boolean not null default false,
  elearning_access    boolean not null default true,
  notes        text default '',                 -- participant's own message
  stage             lead_stage     not null default 'lead',
  interest          interest_level not null default 'interested',
  reminders_active  boolean        not null default true,
  sign_channel      sign_channel,
  deposit_paid_at     timestamptz,
  contract_signed_at  timestamptz,
  confirmed_at        timestamptz,
  lms_provisioned_at  timestamptz,
  lms_user_id         text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lead_comments (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads(id) on delete cascade,
  author     text,                              -- logged-in staff name/email
  body       text not null,
  created_at timestamptz not null default now()
);

create table documents (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references leads(id) on delete cascade,
  file_url     text,
  sign_channel sign_channel,
  signed       boolean not null default false,
  verified     boolean not null default false,
  verified_at  timestamptz,
  created_at   timestamptz not null default now()
);

create table lead_events (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads(id) on delete cascade,
  type       text not null,
  payload    jsonb,
  created_at timestamptz not null default now()
);

create table email_log (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid references leads(id) on delete set null,
  template   text,
  to_email   text,
  status     text,
  sent_at    timestamptz not null default now()
);

create table skills (
  id            uuid primary key default gen_random_uuid(),
  key           text unique not null,
  name          text not null,
  description   text default '',
  category      text default 'general',
  system_prompt text not null,                  -- the .md body
  inputs        jsonb not null default '[]',    -- [{name,label,type,placeholder,options,sample}]
  model         text not null default 'claude-opus-4-8',
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table skill_runs (                       -- optional history tab
  id         uuid primary key default gen_random_uuid(),
  skill_id   uuid references skills(id) on delete set null,
  inputs     jsonb,
  output     text,
  run_by     text,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index leads_stage_idx     on leads (stage);
create index leads_interest_idx  on leads (interest);
create index leads_training_idx  on leads (training_id);
create index comments_lead_idx   on lead_comments (lead_id);
create index documents_lead_idx  on documents (lead_id);
create index events_lead_idx     on lead_events (lead_id);

-- ---------- 3. TRIGGERS ----------
-- human ref (REG-000001, …)
create sequence if not exists lead_ref_seq;
create or replace function set_lead_ref() returns trigger as $$
begin
  if new.ref is null then
    new.ref := 'REG-' || to_char(nextval('lead_ref_seq'), 'FM000000');
  end if;
  return new;
end; $$ language plpgsql;
create trigger trg_set_lead_ref before insert on leads
  for each row execute function set_lead_ref();

-- updated_at bump
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
create trigger trg_touch_trainings before update on trainings
  for each row execute function touch_updated_at();
create trigger trg_touch_leads before update on leads
  for each row execute function touch_updated_at();
create trigger trg_touch_skills before update on skills
  for each row execute function touch_updated_at();

-- seat counting + open/full status
create or replace function bump_enrolled() returns trigger as $$
begin
  if new.stage = 'confirmed' and old.stage is distinct from 'confirmed' then
    update trainings set enrolled = enrolled + 1 where id = new.training_id;
  elsif old.stage = 'confirmed' and new.stage is distinct from 'confirmed' then
    update trainings set enrolled = greatest(0, enrolled - 1) where id = new.training_id;
  end if;
  update trainings
    set status = case when enrolled >= capacity then 'full' else 'open' end
    where id = new.training_id;
  return new;
end; $$ language plpgsql;
create trigger trg_bump_enrolled after update of stage on leads
  for each row execute function bump_enrolled();

-- ---------- 4. RLS ----------
alter table trainings     enable row level security;
alter table leads         enable row level security;
alter table lead_comments enable row level security;
alter table documents     enable row level security;
alter table lead_events   enable row level security;
alter table email_log     enable row level security;
alter table skills        enable row level security;
alter table skill_runs    enable row level security;

-- trainings: public read, staff manage
create policy trainings_public_read on trainings for select using (true);
create policy trainings_staff_all   on trainings for all to authenticated using (true) with check (true);

-- leads: anon can only INSERT; staff full read/update/delete
create policy leads_anon_insert  on leads for insert to anon with check (true);
create policy leads_staff_read    on leads for select to authenticated using (true);
create policy leads_staff_update  on leads for update to authenticated using (true) with check (true);
create policy leads_staff_delete  on leads for delete to authenticated using (true);

-- staff-only tables
create policy comments_staff  on lead_comments for all to authenticated using (true) with check (true);
create policy documents_staff on documents     for all to authenticated using (true) with check (true);
create policy events_staff    on lead_events    for all to authenticated using (true) with check (true);
create policy emails_staff    on email_log      for all to authenticated using (true) with check (true);
create policy skills_staff    on skills         for all to authenticated using (true) with check (true);
create policy skillruns_staff on skill_runs     for all to authenticated using (true) with check (true);
-- NOTE: the SaaS uses its own HMAC-cookie auth, so its server calls Supabase with the
-- SERVICE_ROLE key (bypasses RLS). n8n also uses service_role. The website uses the ANON
-- key and relies on the policies above (insert leads / read trainings only).

-- ---------- 5. REALTIME ----------
alter publication supabase_realtime add table leads;
alter publication supabase_realtime add table lead_comments;

-- ---------- 6. STORAGE ----------
-- Private bucket for signed engagement documents (both signing paths).
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;
