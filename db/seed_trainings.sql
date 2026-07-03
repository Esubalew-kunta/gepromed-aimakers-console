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
