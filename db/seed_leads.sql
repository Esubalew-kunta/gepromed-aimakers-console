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
