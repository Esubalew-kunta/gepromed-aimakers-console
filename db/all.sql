-- ============================================================================
-- ALL-IN-ONE setup for the Gepromed backend. Paste this whole file into the
-- Supabase SQL editor of the project YOU control, and Run once.
-- Order: schema -> trainings -> skills -> leads -> run-counter column.
-- (Concatenation of schema.sql, seed_trainings.sql, skills.sql,
--  seed_leads.sql, skill_runs_key.sql — run on a FRESH/empty project.)
-- ============================================================================

-- ========================== 1. SCHEMA ==========================
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

-- ==================== 2. SEED: TRAININGS ====================
-- ============================================================================
-- Seed: the 5 existing trainings (ported 1:1 from the website lib/trainings.ts)
-- Run AFTER schema.sql. Bilingual fields use dollar-quoted JSON ($j$…$j$) so
-- French apostrophes need no escaping. Re-runnable via ON CONFLICT (slug).
-- ============================================================================

insert into trainings
  (slug, title, specialty, level, audience, city, venue, start_date, end_date,
   duration_days, price_eur, deposit_eur, capacity, enrolled, qualiopi, summary,
   objectives, program, supervisors, satisfaction, pass_rate, photos, status)
values
-- 1) Peripheral vascular access — advanced (upcoming)
(
  'abord-vasculaire-peripherique-2026-09',
  $j${"fr":"Abord vasculaire périphérique — module avancé","en":"Peripheral vascular access — advanced module"}$j$,
  'vascular','Advanced','Europe','Strasbourg',
  $j${"fr":"Institut Gepromed — Plateau technique","en":"Gepromed Institute — Technical platform"}$j$,
  '2026-09-22','2026-09-24',3,2400,600,16,11,true,
  $j${"fr":"Trois jours de pratique intensive sur modèles anatomiques et simulateurs haute-fidélité pour maîtriser les abords vasculaires périphériques complexes.","en":"Three days of intensive practice on anatomical models and high-fidelity simulators to master complex peripheral vascular access."}$j$,
  $j$[{"fr":"Sécuriser l'abord fémoral, huméral et poplité","en":"Secure femoral, brachial and popliteal access"},{"fr":"Gérer les complications hémorragiques en simulation","en":"Manage haemorrhagic complications in simulation"},{"fr":"Intégrer l'imagerie per-opératoire à la décision chirurgicale","en":"Integrate intra-operative imaging into surgical decisions"}]$j$,
  $j$[{"day":{"fr":"Jour 1 — Fondamentaux","en":"Day 1 — Fundamentals"},"items":[{"fr":"Anatomie appliquée et repérage échographique","en":"Applied anatomy and ultrasound landmarks"},{"fr":"Atelier ponction guidée","en":"Guided puncture workshop"},{"fr":"Débriefing vidéo individualisé","en":"Individual video debrief"}]},{"day":{"fr":"Jour 2 — Pratique avancée","en":"Day 2 — Advanced practice"},"items":[{"fr":"Abords complexes sur modèle perfusé","en":"Complex access on perfused model"},{"fr":"Gestion de crise hémorragique","en":"Haemorrhagic crisis management"},{"fr":"Simulation en binôme superviseur / apprenant","en":"Supervisor / trainee paired simulation"}]},{"day":{"fr":"Jour 3 — Évaluation","en":"Day 3 — Assessment"},"items":[{"fr":"Cas intégratifs","en":"Integrative cases"},{"fr":"Évaluation certifiante","en":"Certifying assessment"},{"fr":"Plan de progression personnalisé","en":"Personalized progression plan"}]}]$j$,
  $j$[{"name":"Dr. A. Lefèvre","role":{"fr":"Chirurgien vasculaire, CHU","en":"Vascular surgeon, University Hospital"}},{"name":"Pr. M. Costa","role":{"fr":"Superviseur réseau Gepromed (Europe)","en":"Gepromed network supervisor (Europe)"}}]$j$,
  null,null,null,'open'
),
-- 2) Phacoemulsification — supervised foundation (upcoming, full 12/12)
(
  'phaco-initiation-2026-11',
  $j${"fr":"Phacoémulsification — initiation supervisée","en":"Phacoemulsification — supervised foundation"}$j$,
  'ophthalmology','Initiation','France','Lyon',
  $j${"fr":"Centre de simulation ophtalmologique","en":"Ophthalmology simulation center"}$j$,
  '2026-11-12','2026-11-13',2,1750,450,12,12,true,
  $j${"fr":"Parcours d'initiation à la phacoémulsification sur simulateur et œil de synthèse, encadré par des superviseurs experts.","en":"A foundation pathway in phacoemulsification on simulator and synthetic eye, led by expert supervisors."}$j$,
  $j$[{"fr":"Maîtriser les étapes clés de la phaco","en":"Master the key steps of phaco"},{"fr":"Développer la coordination bi-manuelle","en":"Develop bi-manual coordination"},{"fr":"Reconnaître et prévenir les complications précoces","en":"Recognize and prevent early complications"}]$j$,
  $j$[{"day":{"fr":"Jour 1","en":"Day 1"},"items":[{"fr":"Théorie condensée et réglages machine","en":"Condensed theory and machine settings"},{"fr":"Capsulorhexis sur simulateur","en":"Capsulorhexis on simulator"},{"fr":"Hydrodissection guidée","en":"Guided hydrodissection"}]},{"day":{"fr":"Jour 2","en":"Day 2"},"items":[{"fr":"Émulsification du noyau","en":"Nucleus emulsification"},{"fr":"Gestion des complications","en":"Complication management"},{"fr":"Évaluation et certificat","en":"Assessment and certificate"}]}]$j$,
  $j$[{"name":"Dr. S. Benali","role":{"fr":"Ophtalmologue, praticien hospitalier","en":"Ophthalmologist, hospital practitioner"}}]$j$,
  null,null,null,'full'
),
-- 3) Aortic endovascular techniques (upcoming)
(
  'endovasculaire-aortique-2027-02',
  $j${"fr":"Techniques endovasculaires aortiques","en":"Aortic endovascular techniques"}$j$,
  'vascular','Expert','Europe','Strasbourg',
  $j${"fr":"Institut Gepromed — Salle hybride","en":"Gepromed Institute — Hybrid room"}$j$,
  '2027-02-04','2027-02-06',3,2950,750,14,5,true,
  $j${"fr":"Programme expert dédié aux endoprothèses aortiques, du planning 3D à la simulation per-procédurale.","en":"An expert program dedicated to aortic stent-grafts, from 3D planning to intra-procedural simulation."}$j$,
  $j$[{"fr":"Planifier une EVAR à partir de l'imagerie 3D","en":"Plan an EVAR from 3D imaging"},{"fr":"Déployer une endoprothèse en simulation","en":"Deploy a stent-graft in simulation"},{"fr":"Anticiper les endofuites et leur prise en charge","en":"Anticipate endoleaks and their management"}]$j$,
  $j$[{"day":{"fr":"Jour 1","en":"Day 1"},"items":[{"fr":"Planning 3D","en":"3D planning"},{"fr":"Sizing et choix du matériel","en":"Sizing and device selection"}]},{"day":{"fr":"Jour 2","en":"Day 2"},"items":[{"fr":"Simulation de déploiement","en":"Deployment simulation"},{"fr":"Gestion des endofuites","en":"Endoleak management"}]},{"day":{"fr":"Jour 3","en":"Day 3"},"items":[{"fr":"Cas complexes","en":"Complex cases"},{"fr":"Évaluation certifiante","en":"Certifying assessment"}]}]$j$,
  $j$[{"name":"Pr. M. Costa","role":{"fr":"Superviseur réseau Gepromed (Europe)","en":"Gepromed network supervisor (Europe)"}},{"name":"Dr. K. Moreau","role":{"fr":"Chirurgien vasculaire endovasculaire","en":"Endovascular vascular surgeon"}}]$j$,
  null,null,null,'open'
),
-- 4) Peripheral vascular access — advanced (PAST, with proof)
(
  'abord-vasculaire-peripherique-2026-03',
  $j${"fr":"Abord vasculaire périphérique — module avancé","en":"Peripheral vascular access — advanced module"}$j$,
  'vascular','Advanced','Europe','Strasbourg',
  $j${"fr":"Institut Gepromed — Plateau technique","en":"Gepromed Institute — Technical platform"}$j$,
  '2026-03-18','2026-03-20',3,2400,600,16,16,true,
  $j${"fr":"Session complète encadrée par le réseau de superviseurs vasculaires Gepromed.","en":"A full session led by the Gepromed vascular supervisors network."}$j$,
  $j$[{"fr":"Sécuriser les abords vasculaires complexes","en":"Secure complex vascular access"},{"fr":"Gérer les complications en simulation","en":"Manage complications in simulation"}]$j$,
  $j$[{"day":{"fr":"Jour 1","en":"Day 1"},"items":[{"fr":"Fondamentaux","en":"Fundamentals"},{"fr":"Atelier ponction","en":"Puncture workshop"}]},{"day":{"fr":"Jour 2","en":"Day 2"},"items":[{"fr":"Pratique avancée","en":"Advanced practice"}]},{"day":{"fr":"Jour 3","en":"Day 3"},"items":[{"fr":"Évaluation certifiante","en":"Certifying assessment"}]}]$j$,
  $j$[{"name":"Dr. A. Lefèvre","role":{"fr":"Chirurgien vasculaire, CHU","en":"Vascular surgeon, University Hospital"}}]$j$,
  97,100,42,'full'
),
-- 5) Phacoemulsification — supervised foundation (PAST, with proof)
(
  'phaco-initiation-2026-01',
  $j${"fr":"Phacoémulsification — initiation supervisée","en":"Phacoemulsification — supervised foundation"}$j$,
  'ophthalmology','Initiation','France','Lyon',
  $j${"fr":"Centre de simulation ophtalmologique","en":"Ophthalmology simulation center"}$j$,
  '2026-01-29','2026-01-30',2,1750,450,12,12,true,
  $j${"fr":"Première session 2026 d'initiation à la phaco.","en":"First 2026 phaco foundation session."}$j$,
  $j$[{"fr":"Maîtriser les étapes clés","en":"Master the key steps"},{"fr":"Coordination bi-manuelle","en":"Bi-manual coordination"}]$j$,
  $j$[{"day":{"fr":"Jour 1","en":"Day 1"},"items":[{"fr":"Capsulorhexis","en":"Capsulorhexis"},{"fr":"Hydrodissection","en":"Hydrodissection"}]},{"day":{"fr":"Jour 2","en":"Day 2"},"items":[{"fr":"Émulsification","en":"Emulsification"},{"fr":"Évaluation","en":"Assessment"}]}]$j$,
  $j$[{"name":"Dr. S. Benali","role":{"fr":"Ophtalmologue, praticien hospitalier","en":"Ophthalmologist, hospital practitioner"}}]$j$,
  94,92,28,'full'
)
on conflict (slug) do nothing;

-- ====================== 3. SKILLS ======================
-- ============================================================================
-- Skills: extend the table with presentational columns + seed the 8 sample
-- skills (ported from src/lib/seed/skills.ts, with live system prompts).
-- Run in the Supabase SQL editor AFTER schema.sql. Re-runnable (upsert by key).
-- When Maneesh's real .skill.md files arrive, re-run with updated rows.
-- ============================================================================

alter table skills add column if not exists icon              text    default 'sparkles';
alter table skills add column if not exists tags              jsonb   default '[]';
alter table skills add column if not exists owner             text    default '';
alter table skills add column if not exists status            text    default 'Live';
alter table skills add column if not exists runs_this_month   int     default 0;
alter table skills add column if not exists avg_minutes_saved int     default 0;

insert into skills
  (key, name, description, category, icon, tags, owner, model, status,
   runs_this_month, avg_minutes_saved, system_prompt, inputs, active)
values
(
  'mdr-gap-analysis',
  'MDR Technical File Gap Analysis',
  $d$Reviews a device's technical documentation summary against EU MDR 2017/745 Annex II/III and flags missing evidence.$d$,
  'Regulatory & Compliance', 'shield-check',
  $j$["MDR","Annex II","Technical file","CE marking"]$j$,
  'Regulatory Affairs', 'Claude Sonnet 5', 'Live', 42, 95,
  $sp$You are a senior EU MDR regulatory affairs expert at Gepromed, a medtech company. Given a device description and a summary of its technical documentation, produce a structured Technical File gap analysis against EU MDR 2017/745 (Annex II Technical Documentation and Annex III PMS). Output GitHub-flavored Markdown with clear sections: what is present & adequate, gaps requiring action (numbered, each tagged Priority: High/Medium/Low), and recommended next steps. Reference the relevant annexes/standards (ISO 14971, MEDDEV 2.7/1 rev 4, ISO 15223-1, GSPR) where appropriate. End with a one-line disclaimer that this is a drafting aid, not regulatory advice.$sp$,
  $j$[{"name":"device","label":"Device name & class","type":"text","placeholder":"e.g. Class IIa wound-care dressing","sample":"NeoDerm Advanced Wound Dressing — Class IIa"},{"name":"documentation","label":"Documentation summary provided","type":"textarea","placeholder":"List the sections currently in the technical file…","sample":"General description, intended purpose, risk management file (ISO 14971), biocompatibility summary, labelling drafts, clinical evaluation plan (no report yet)."}]$j$,
  true
),
(
  'clinical-eval-summary',
  'Clinical Evaluation Literature Summary',
  $d$Turns a batch of study abstracts into a structured clinical evidence summary with a benefit/risk narrative.$d$,
  'Clinical & Quality', 'activity',
  $j$["CER","Literature","Benefit-risk","MEDDEV"]$j$,
  'Clinical Affairs', 'Claude Sonnet 5', 'Live', 28, 70,
  $sp$You are a clinical affairs expert at Gepromed. Given a device/therapy and pasted study abstracts or findings, synthesize them into a structured clinical evidence summary suitable for a Clinical Evaluation Report (CER) per MEDDEV 2.7/1 rev 4. Output GitHub-flavored Markdown with: evidence base (sources, pooled N, appraisal method), a synthesis table (Outcome | Finding | Confidence), a benefit-risk narrative, and identified gaps with PMCF pointers. Stay objective and evidence-grounded; do not overstate. End with a one-line note that clinician review is required.$sp$,
  $j$[{"name":"device","label":"Device / therapy","type":"text","sample":"Bioresorbable coronary scaffold"},{"name":"abstracts","label":"Pasted abstracts / findings","type":"textarea","placeholder":"Paste 2–5 study abstracts or key findings…","sample":"Study A (n=210): non-inferior MACE vs metallic stent at 12 months. Study B (n=95): higher late lumen loss. Study C registry (n=1,400): 1.8% scaffold thrombosis at 24 months."}]$j$,
  true
),
(
  'capa-drafter',
  'CAPA Investigation Drafter',
  $d$Generates a structured Corrective & Preventive Action record from a complaint or nonconformity description.$d$,
  'Clinical & Quality', 'clipboard-check',
  $j$["CAPA","ISO 13485","Root cause","QMS"]$j$,
  'Quality Management', 'Claude Sonnet 5', 'Live', 51, 40,
  $sp$You are a quality management expert at Gepromed working to ISO 13485:2016. Given a nonconformity or complaint description, draft a structured CAPA record. Output GitHub-flavored Markdown with numbered sections: Problem statement, Immediate containment, Root cause (include a brief 5-Why chain), Corrective actions, Preventive actions, and Effectiveness check. Reference ISO 13485 clauses (§8.5.2/§8.5.3) where relevant and consider vigilance/FSCA reportability. End with a one-line note to route to QA for approval.$sp$,
  $j$[{"name":"issue","label":"Nonconformity / complaint","type":"textarea","placeholder":"Describe what happened…","sample":"Three field complaints of packaging seal failure on Lot 24-118 detected on arrival; sterile barrier potentially compromised."}]$j$,
  true
),
(
  'grant-proposal',
  'Funding & Grant Proposal Assistant',
  $d$Drafts a structured proposal section for medical-device innovation grants (Horizon Europe / regional funds).$d$,
  'Project & Funding', 'sparkles',
  $j$["Horizon Europe","Funding","Innovation","Proposal"]$j$,
  'Project Office', 'Claude Sonnet 5', 'Live', 17, 120,
  $sp$You are a grant-writing specialist for medical-device innovation at Gepromed. Given a project idea and a target funding call/programme (e.g. Horizon Europe), draft a compelling proposal section. Output GitHub-flavored Markdown structured as Excellence, Impact (clinical, economic, societal — with plausible quantified estimates), Implementation (work packages & timeline), and Consortium fit (Gepromed's regulatory/clinical role). Be persuasive but credible and grounded. End with a one-line note that this is an editable draft for grant writers.$sp$,
  $j$[{"name":"project","label":"Project idea","type":"textarea","placeholder":"Describe the innovation and its clinical need…","sample":"AI-assisted early detection of surgical site infection using a low-cost wearable temperature/impedance patch for post-op patients."},{"name":"call","label":"Target call / programme","type":"text","sample":"Horizon Europe — Cluster 1 Health, digital & data-driven care"}]$j$,
  true
),
(
  'vigilance-triage',
  'Vigilance & Incident Triage',
  $d$Classifies an incident report for reportability and drafts a manufacturer incident summary.$d$,
  'Regulatory & Compliance', 'alert-triangle',
  $j$["Vigilance","MIR","Reportability","Post-market"]$j$,
  'Regulatory Affairs', 'Claude Sonnet 5', 'Beta', 23, 35,
  $sp$You are a vigilance and post-market surveillance expert at Gepromed. Given an incident description, classify it and assess reportability under EU MDR Article 87. Output GitHub-flavored Markdown with: Classification (event type, harm level), a Reportability decision with reasoning and applicable timelines (2/10/15-day), Recommended actions, and a short draft manufacturer incident (MIR) summary as a blockquote. Be cautious; explicitly flag where qualified RA sign-off is needed. End with a one-line disclaimer that the final reportability decision requires qualified RA review.$sp$,
  $j$[{"name":"incident","label":"Incident description","type":"textarea","placeholder":"What happened, to whom, and what was the outcome?","sample":"Infusion pump displayed occlusion alarm delay of ~40s during a home-care session; no patient harm, therapy paused by caregiver."}]$j$,
  true
),
(
  'patient-comm',
  'Plain-Language Patient Communication',
  $d$Rewrites clinical or technical text into clear, reassuring patient-facing language (with reading-level target).$d$,
  'Communication', 'message-square',
  $j$["Health literacy","IFU","Patient","Plain language"]$j$,
  'Medical Communication', 'Claude Sonnet 5', 'Live', 64, 25,
  $sp$You are a health-literacy and medical communication expert at Gepromed. Rewrite the provided clinical or technical text into clear, reassuring, patient-facing plain language at roughly a grade 7 reading level. Output GitHub-flavored Markdown: a short 'What to do' explanation, then a bulleted 'Please remember' list of practical instructions. Keep it warm and non-alarming without losing accuracy; do NOT add any medical claim not present in the source. End with a one-line note to review with a clinician before patient use.$sp$,
  $j$[{"name":"text","label":"Clinical text to simplify","type":"textarea","placeholder":"Paste the technical text…","sample":"Following implantation, patients should undergo dual antiplatelet therapy for a minimum of 6 months to mitigate the risk of scaffold thrombosis."}]$j$,
  true
),
(
  'meeting-actions',
  'Meeting Notes → Action Tracker',
  $d$Converts raw meeting notes into a clean summary, decisions log, and assigned action items.$d$,
  'Operations', 'list-checks',
  $j$["Meetings","Actions","Productivity"]$j$,
  'Project Office', 'Claude Sonnet 5', 'Live', 88, 20,
  $sp$You are an executive assistant for Gepromed's project office. Convert raw meeting notes into a clean structured record. Output GitHub-flavored Markdown with: a one-line topic, Decisions (bulleted), Action items as a table (Owner | Action | Due), and Blockers. Infer owners and due dates ONLY from the notes provided; never invent commitments. End with a one-line note.$sp$,
  $j$[{"name":"notes","label":"Raw meeting notes","type":"textarea","placeholder":"Paste your notes…","sample":"Reviewed NeoDerm timeline. CER still blocking. Camille to commission CER by 15/07. Étienne wants NB pre-submission call. Budget for pilot approved. Labelling review next week."}]$j$,
  true
),
(
  'training-generator',
  'Micro-Training Generator',
  $d$Creates a short internal training module (objectives, script, and a quick quiz) on any compliance topic.$d$,
  'Training & Enablement', 'graduation-cap',
  $j$["Training","LMS","Enablement","Quiz"]$j$,
  'People & Enablement', 'Claude Sonnet 5', 'Beta', 31, 60,
  $sp$You are an instructional designer at Gepromed. Given a training topic and audience, create a short (~8 minute) internal micro-training. Output GitHub-flavored Markdown with: a title plus an audience/duration line, 3 Learning objectives, a Script excerpt as a blockquote, and a 3-question Quick quiz with the answer in parentheses after each question. Keep it practical and compliance-oriented. End with a one-line note that it can be published to the LMS.$sp$,
  $j$[{"name":"topic","label":"Training topic","type":"text","sample":"How to log a product complaint correctly"},{"name":"audience","label":"Audience","type":"select","options":["Customer support","Sales","Production","All staff"],"sample":"Customer support"}]$j$,
  true
)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  icon = excluded.icon,
  tags = excluded.tags,
  owner = excluded.owner,
  model = excluded.model,
  status = excluded.status,
  runs_this_month = excluded.runs_this_month,
  avg_minutes_saved = excluded.avg_minutes_saved,
  system_prompt = excluded.system_prompt,
  inputs = excluded.inputs,
  active = excluded.active,
  updated_at = now();

-- ==================== 4. SEED: LEADS ====================
-- ============================================================================
-- Demo leads so the Lead Management board is populated before the website is
-- wired (Phase 7). Run AFTER schema.sql + seed_trainings.sql. Re-runnable:
-- it deletes these demo emails first (cascades to their comments), then inserts.
-- ============================================================================

delete from leads where email in (
  'c.roux@chu-exemple.fr',
  'liam.schneider@example.de',
  's.marin@clinique-exemple.fr',
  'marco.rossi@example.it'
);

-- 1) Contract signed, highly interested (near confirmation)
insert into leads
  (training_id, training_title_snapshot, first_name, last_name, email, phone,
   profession, institution, country, dietary, arrival, needs_accommodation,
   elearning_access, notes, stage, interest, reminders_active, sign_channel,
   deposit_paid_at, contract_signed_at, created_at)
values (
  (select id from trainings where slug = 'abord-vasculaire-peripherique-2026-09'),
  'Abord vasculaire périphérique — module avancé',
  'Camille', 'Roux', 'c.roux@chu-exemple.fr', '+33 6 12 34 56 78',
  'Chirurgien vasculaire', 'CHU Exemple', 'France', 'Sans gluten', '21/09 au soir',
  true, true, 'Souhaite une facture au nom de l''établissement.',
  'contract_signed', 'highly_interested', true, 'manual',
  now() - interval '3 days', now() - interval '2 days', now() - interval '4 days'
);

-- 2) Fresh lead, interested (unpaid)
insert into leads
  (training_id, training_title_snapshot, first_name, last_name, email, phone,
   profession, institution, country, elearning_access, notes,
   stage, interest, reminders_active, created_at)
values (
  (select id from trainings where slug = 'endovasculaire-aortique-2027-02'),
  'Techniques endovasculaires aortiques',
  'Liam', 'Schneider', 'liam.schneider@example.de', '+49 151 23456789',
  'Chirurgien vasculaire', 'Universitätsklinikum', 'Allemagne', false,
  'Intéressé mais attend validation du chef de service.',
  'lead', 'interested', true, now() - interval '2 days'
);

-- 3) Deposit paid, neutral (awaiting contract)
insert into leads
  (training_id, training_title_snapshot, first_name, last_name, email, phone,
   profession, institution, country, needs_accommodation, elearning_access,
   stage, interest, reminders_active, deposit_paid_at, created_at)
values (
  (select id from trainings where slug = 'endovasculaire-aortique-2027-02'),
  'Techniques endovasculaires aortiques',
  'Sofia', 'Marin', 's.marin@clinique-exemple.fr', '+33 6 98 76 54 32',
  'Radiologue interventionnel', 'Clinique Exemple', 'France', true, true,
  'deposit_paid', 'neutral', true, now() - interval '1 day', now() - interval '5 days'
);

-- 4) Lead, not interested → hard stop (reminders off)
insert into leads
  (training_id, training_title_snapshot, first_name, last_name, email, phone,
   profession, institution, country, elearning_access,
   stage, interest, reminders_active, created_at)
values (
  (select id from trainings where slug = 'abord-vasculaire-peripherique-2026-09'),
  'Abord vasculaire périphérique — module avancé',
  'Marco', 'Rossi', 'marco.rossi@example.it', '+39 340 1112223',
  'Chirurgien', 'Ospedale Esempio', 'Italie', false,
  'lead', 'not_interested', false, now() - interval '6 days'
);

-- A couple of staff comments on the first lead
insert into lead_comments (lead_id, author, body, created_at)
select id, 'Nicole', 'Acompte confirmé.', now() - interval '3 days'
from leads where email = 'c.roux@chu-exemple.fr';
insert into lead_comments (lead_id, author, body, created_at)
select id, 'Nicole', 'Contrat reçu signé — à confirmer.', now() - interval '2 days'
from leads where email = 'c.roux@chu-exemple.fr';
insert into lead_comments (lead_id, author, body, created_at)
select id, 'Nicole', 'Relance e-mail envoyée.', now() - interval '1 day'
from leads where email = 'liam.schneider@example.de';

-- ============= 5. RUN-COUNTER COLUMN =============
-- ============================================================================
-- Make "runs this month" real: tag each skill_run with the skill's key so we
-- can count runs per skill without a uuid lookup. Run in the SQL editor.
-- ============================================================================

alter table skill_runs add column if not exists skill_key text;
create index if not exists skill_runs_key_created_idx
  on skill_runs (skill_key, created_at);
