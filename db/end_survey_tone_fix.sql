-- ============================================================================
-- Tone fix: trainee.bootcamp.end_survey (sent at stage 'done', i.e. the
-- bootcamp-completion email) opened with "Quelle édition !" — an overly
-- enthusiastic exclamation ("what a fantastic edition!") that reads as
-- unprofessional for a transactional email. Replaced with a plain,
-- professional thank-you that keeps the warmth without the hype. Meaning/
-- merge fields ({{title}}, {{elearning_link}}, {{survey_link}}) unchanged.
--
-- Run in the Supabase SQL editor (project aablleekwyjqdxsscyeo), or via
-- psql against DATABASE_URL. SAFE + IDEMPOTENT — re-runnable.
-- ============================================================================
begin;

update notification_templates
set body =
'Bonjour à toutes et à tous,

Nous vous remercions d''avoir participé à {{title}} et de votre engagement tout au long de ces journées. Votre participation active a contribué à la réussite de cette session.

Quelques dernières étapes à compléter — pour finaliser votre participation, merci de prendre quelques minutes pour :
- Vous reconnecter sur la page dédiée pour accéder au module e-learning : {{elearning_link}}
- Compléter le court questionnaire post-bootcamp
- Remplir l''enquête de satisfaction : {{survey_link}}

Vos retours sont précieux : ils nous aident directement à améliorer les prochaines éditions.

Votre attestation de participation sera disponible au téléchargement dès que ces étapes seront complétées.

Merci encore pour votre confiance.

Cordialement,'
where key = 'trainee.bootcamp.end_survey';

commit;
