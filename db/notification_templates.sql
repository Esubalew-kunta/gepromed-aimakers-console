-- ============================================================================
-- notification_templates — one editable row per email a pipeline can send.
-- Master Plan Decision 2 (LOCKED): email copy lives in the DB so staff
-- (Nicole/Nathalie) edit wording without touching n8n; automations only render
-- {{merge_fields}} and send from the right identity.
--
-- Phase 0 seeds the trainee ROUTING (key / pipeline / variant / stage / trigger
-- / sender / subject). Phase 3 fills the verbatim bodies + wires n8n. The two
-- client "à écrire / à refaire" templates ship inactive (active=false).
-- Run in the SQL editor of project hdvqiiprylrrzrkydtpa.
-- ============================================================================

create table if not exists notification_templates (
  key         text primary key,                 -- e.g. 'trainee.hms.enrollment_request'
  pipeline    text not null,                     -- 'trainee' | 'explant' | 'test' | 'equipment'
  variant     text,                              -- 'helpmesee' | 'bootcamp' | 'hospital' | 'industrial' | null
  stage       text,                              -- the stage this email relates to (null = pipeline-wide)
  trigger     text not null default 'stage_enter', -- 'stage_enter' | 'reminder' | 'manual'
  sender      text not null,                     -- 'hms@gepromed.com' | 'education@gepromed.com' | ...
  lang        text not null default 'fr',
  subject     text not null,
  body        text not null default '',          -- HTML/markdown with {{merge_fields}} (filled in Phase 3)
  attachments text[] not null default '{}',      -- logical attachment keys (enrollment_form, engagement_contract, ...)
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists notif_templates_route_idx
  on notification_templates (pipeline, variant, stage, trigger);

-- reuse the shared updated_at bump (defined in schema.sql)
drop trigger if exists trg_touch_notification_templates on notification_templates;
create trigger trg_touch_notification_templates before update on notification_templates
  for each row execute function touch_updated_at();

-- RLS: staff manage; the service_role (app + n8n) bypasses RLS.
alter table notification_templates enable row level security;
drop policy if exists notif_templates_staff on notification_templates;
create policy notif_templates_staff on notification_templates
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Seed: trainee journey routing. Bodies are TODO (Phase 3, verbatim client copy).
-- ---------------------------------------------------------------------------
insert into notification_templates (key, pipeline, variant, stage, trigger, sender, lang, subject, attachments, active) values
  -- HelpMeSee (hms@gepromed.com)
  ('trainee.hms.enrollment_request', 'trainee', 'helpmesee', 'lead',             'stage_enter', 'hms@gepromed.com',       'fr', 'Votre demande d''inscription — formation cataracte sur simulateur', '{enrollment_form}', true),
  ('trainee.hms.date_proposals',     'trainee', 'helpmesee', 'dates_validation', 'stage_enter', 'hms@gepromed.com',       'fr', 'Propositions de dates pour votre formation',                       '{}',                true),
  ('trainee.hms.confirmation',       'trainee', 'helpmesee', 'invoice',          'stage_enter', 'hms@gepromed.com',       'fr', 'Confirmation de votre formation + facture',                        '{invoice}',         true),
  ('trainee.hms.practical_info',     'trainee', 'helpmesee', 'elearning_check',  'stage_enter', 'hms@gepromed.com',       'en', 'Welcome to your training — practical information',                  '{practical_info}',  true),
  ('trainee.hms.credentials',        'trainee', 'helpmesee', 'simulator_access', 'stage_enter', 'hms@gepromed.com',       'en', 'Your simulator credentials',                                       '{}',                false), -- à écrire
  ('trainee.hms.satisfaction',       'trainee', 'helpmesee', 'done',             'stage_enter', 'hms@gepromed.com',       'en', '[HMS] End-of-Course Feedback Survey',                               '{survey}',          true),
  -- Bootcamps & Workshops (education@gepromed.com)
  ('trainee.bootcamp.request_received',  'trainee', 'bootcamp', 'lead',             'stage_enter', 'education@gepromed.com', 'en', 'We have received your request — {{title}}',        '{}',                                 true),
  ('trainee.bootcamp.prerequisites',     'trainee', 'bootcamp', 'prerequisites',    'stage_enter', 'education@gepromed.com', 'en', 'We have received your request — {{title}}',        '{}',                                 false), -- superseded by request_received (sent at 'lead') to avoid duplicate emails
  ('trainee.bootcamp.registration',      'trainee', 'bootcamp', 'pre_registration', 'stage_enter', 'education@gepromed.com', 'en', 'Your registration request — {{title}}',            '{engagement_contract,deposit_link}', true),
  ('trainee.bootcamp.relance',           'trainee', 'bootcamp', 'pre_registration', 'reminder',    'education@gepromed.com', 'en', 'Rappel — caution & contrat',                        '{}',                                 true),
  ('trainee.bootcamp.confirmation',      'trainee', 'bootcamp', 'deposit_contract', 'stage_enter', 'education@gepromed.com', 'en', 'Registration confirmed — {{title}}',                '{}',                                 true),
  ('trainee.bootcamp.practical_info',    'trainee', 'bootcamp', 'practical_info',   'stage_enter', 'education@gepromed.com', 'en', '{{title}} — Practical Information',                  '{program,map}',                      true),
  ('trainee.bootcamp.elearning',         'trainee', 'bootcamp', 'elearning_sent',   'stage_enter', 'education@gepromed.com', 'en', 'Action required — e-learning modules to complete',  '{}',                                 true),
  ('trainee.bootcamp.elearning_relance', 'trainee', 'bootcamp', 'elearning_sent',   'reminder',    'education@gepromed.com', 'en', 'Reminder — complete your e-learning before the bootcamp', '{}',                            true),
  ('trainee.bootcamp.end_survey',        'trainee', 'bootcamp', 'done',             'stage_enter', 'education@gepromed.com', 'en', 'Thank you — {{title}} + final modules & survey',     '{}',                                 true)
on conflict (key) do nothing;
