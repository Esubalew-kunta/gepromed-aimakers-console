-- ============================================================================
-- Remove mid-sentence em dashes from email body prose (reads as AI-generated).
-- Scoped to BODY text only — subject lines like "Titre — {{title}}" use the
-- dash as a clean category/title separator, a normal, professional
-- convention, and are left untouched.
--
-- Audited all 19 trainee templates: 4 had a body-prose em dash.
-- Run in the Supabase SQL editor (project aablleekwyjqdxsscyeo). Idempotent
-- (each UPDATE targets exact old text; re-running after it's applied once is
-- a no-op).
-- ============================================================================
begin;

update notification_templates
set body = replace(
  body,
  'est désormais entièrement confirmée — merci d''avoir finalisé votre inscription.',
  'est désormais entièrement confirmée. Merci d''avoir finalisé votre inscription.'
)
where key = 'trainee.bootcamp.confirmed';

update notification_templates
set body = replace(
  replace(
    body,
    'Ceci est un rappel amical : {{title}} approche à grands pas — début le {{dates}} — et nous n''avons pas encore enregistré la finalisation de vos modules e-learning obligatoires.',
    'Ceci est un rappel amical : {{title}} approche à grands pas (début le {{dates}}) et nous n''avons pas encore enregistré la finalisation de vos modules e-learning obligatoires.'
  ),
  'En cas de difficulté, n''hésitez pas à nous contacter — nous serons ravis de vous aider.',
  'En cas de difficulté, n''hésitez pas à nous contacter, nous serons ravis de vous aider.'
)
where key = 'trainee.bootcamp.elearning_relance';

update notification_templates
set body = replace(
  body,
  'Quelques dernières étapes à compléter — pour finaliser votre participation, merci de prendre quelques minutes pour :',
  'Quelques dernières étapes à compléter pour finaliser votre participation. Merci de prendre quelques minutes pour :'
)
where key = 'trainee.bootcamp.end_survey';

update notification_templates
set body = replace(
  body,
  'Les ateliers débutent le lendemain matin à 8h00 précises — merci d''arriver à l''heure afin d''assurer un bon démarrage.',
  'Les ateliers débutent le lendemain matin à 8h00 précises. Merci d''arriver à l''heure afin d''assurer un bon démarrage.'
)
where key = 'trainee.bootcamp.practical_info';

commit;
