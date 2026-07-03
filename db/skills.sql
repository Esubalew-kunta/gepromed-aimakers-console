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
