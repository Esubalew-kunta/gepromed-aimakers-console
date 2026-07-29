-- ============================================================================
-- Phase 11 — French by default + remove the " -- " AI-sounding dash pattern.
-- Applied directly against project hdvqiiprylrrzrkydtpa.
--
-- Context: all 12 Bootcamp trainee templates (lang='en') were still in
-- English while every HelpMeSee template is already French — inconsistent
-- for a French company writing to French-speaking trainees. Translated all
-- 12 to French (content preserved, not summarized/shortened) and set
-- lang='fr'. Also fixed the " -- " literal-double-hyphen pattern used as an
-- em-dash substitute inside render_notification()'s dynamically-built
-- {{registration_steps}} / {{confirmation_ack}} strings (flagged as reading
-- as AI-generated) — rewritten in French without it, and the self-funded
-- {{confirmation_ack}} ("I acknowledge receipt of your signed contract...")
-- rewritten in a natural French voice instead of the stiff literal original.
-- ============================================================================

-- ---- 1. render_notification(): French dynamic strings, no " -- " ----
CREATE OR REPLACE FUNCTION public.render_notification(p_lead uuid, p_template_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare tpl record; l record; t record; subj text; bod text; block text; dates text;
  v_sponsor_name text; v_registration_steps text; v_confirmation_ack text; v_sponsor_html text;
  v_attachment_url text; v_attachment_name text; ct record;
  v_instructor_name text; v_title text;
  -- DEMO ACCOUNT — placeholder only, NOT a real Gepromed bank account.
  v_bank_details text :=
    'Titulaire du compte : GEPROMED SARL' || E'\n' ||
    'Banque : BNP Paribas, Strasbourg Kléber' || E'\n' ||
    'IBAN : FR76 3000 4028 3701 0023 4567 891' || E'\n' ||
    'BIC/SWIFT : BNPAFRPPXXX' || E'\n' ||
    'Référence : merci d''indiquer votre nom complet + l''intitulé de la formation';
begin
  select * into tpl from notification_templates where key = p_template_key and active limit 1;
  if not found then return jsonb_build_object('send', false, 'reason', 'template inactive/missing'); end if;
  select * into l from leads where id = p_lead;
  if not found then return jsonb_build_object('send', false, 'reason', 'lead missing'); end if;
  select * into t from trainings where id = l.training_id;

  dates := coalesce(to_char(t.start_date, 'DD/MM/YYYY'), '')
    || case when t.end_date is not null and t.end_date <> t.start_date
            then ' au ' || to_char(t.end_date, 'DD/MM/YYYY') else '' end;

  v_title := coalesce(t.title->>'fr', t.title->>'en', '');
  v_sponsor_name := (select string_agg(s->>'name', ', ') from jsonb_array_elements(coalesce(t.sponsors,'[]'::jsonb)) s);

  v_instructor_name := coalesce(
    (select s->>'name' from jsonb_array_elements(coalesce(t.supervisors,'[]'::jsonb)) s limit 1),
    'un membre de notre équipe pédagogique'
  );

  if coalesce(t.is_sponsored, false) then
    block := 'Sponsorisé : ' || coalesce(v_sponsor_name, 'labo(s)');
    v_registration_steps :=
      'Votre place est entièrement financée par ' || coalesce(v_sponsor_name, 'notre sponsor') ||
      ', aucune caution ni contrat d''engagement ne vous sera demandé. Votre inscription est confirmée directement.';
    v_confirmation_ack :=
      'Votre inscription pour ' || v_title ||
      ', qui se déroulera à Gepromed le ' || dates ||
      ', est confirmée : aucune caution ni contrat n''est requis, votre place étant financée par ' ||
      coalesce(v_sponsor_name, 'notre sponsor') || '.';

    select string_agg(
      '<tr><td style="padding:14px 28px 0;">' ||
      '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' ||
      '<td style="padding:10px 14px;background:#f5f3ff;border:1px solid #ece9fe;border-radius:10px;">' ||
      '<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:middle;padding-right:12px;">' ||
      case when nullif(s->>'logoUrl','') is not null then
        '<img src="' || replace(replace(s->>'logoUrl','"','&quot;'),'<','&lt;') ||
        '" alt="' || replace(replace(coalesce(s->>'name','Sponsor'),'&','&amp;'),'"','&quot;') ||
        '" height="32" style="height:32px;max-width:140px;object-fit:contain;display:block;">'
      else
        '<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="height:32px;width:32px;border-radius:8px;background:#8b5cf6;color:#ffffff;font-weight:bold;font-size:13px;text-align:center;vertical-align:middle;">' ||
        upper(left(coalesce(replace(s->>'name','&','&amp;'),'SP'),2)) || '</td></tr></table>'
      end ||
      '</td><td style="vertical-align:middle;">' ||
      '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#7c6ff0;font-weight:bold;">Formation financée par</div>' ||
      '<div style="font-size:14px;font-weight:600;color:#1f2430;">' || replace(coalesce(s->>'name','Sponsor'),'&','&amp;') || '</div>' ||
      '</td></tr></table>' ||
      '</td></tr></table>' ||
      '</td></tr>',
      ''
    ) into v_sponsor_html
    from jsonb_array_elements(coalesce(t.sponsors,'[]'::jsonb)) s;
  else
    block := 'Tarif participant : ' || coalesce(t.price_eur::text, '') || ' EUR';
    v_registration_steps :=
      '- Signer le contrat d''engagement de la formation (joint à cet e-mail).' || E'\n' ||
      '- Régler une caution de 200 € par virement bancaire sur le compte ci-dessous, puis répondre à cet e-mail avec une capture d''écran ou un justificatif du virement comme preuve de paiement (les cautions sont vérifiées manuellement) :' || E'\n\n' ||
      v_bank_details || E'\n\n' ||
      'Cette caution est intégralement remboursée à la fin de la formation. Elle a été mise en place afin de limiter les désistements de dernière minute et d''assurer une bonne organisation logistique pour l''ensemble des participants.';
    v_confirmation_ack :=
      'Nous confirmons la bonne réception de votre contrat signé ainsi que du paiement de votre caution pour ' ||
      v_title || ', qui se déroulera à Gepromed le ' || dates || '.';
    v_sponsor_html := null;
  end if;

  v_attachment_url := null;
  v_attachment_name := null;
  if 'engagement_contract' = any(coalesce(tpl.attachments, '{}'))
     and not coalesce(t.is_sponsored, false)
     and l.contract_template_id is not null then
    select * into ct from contract_templates where id = l.contract_template_id;
    if found and ct.file_url is not null then
      v_attachment_url := 'https://hdvqiiprylrrzrkydtpa.supabase.co/storage/v1/object/public/contracts/' || ct.file_url;
      v_attachment_name := 'Contrat_engagement_' || regexp_replace(coalesce(t.title->>'fr','Gepromed'), '[^a-zA-Z0-9]+', '_', 'g') ||
        '.' || coalesce(substring(ct.file_url from '\.([a-zA-Z0-9]+)$'), 'pdf');
    end if;
  end if;

  subj := tpl.subject; bod := tpl.body;

  subj := replace(replace(replace(subj, '{{title}}', v_title),
                          '{{first_name}}', coalesce(l.first_name,'')),
                  '{{last_name}}', coalesce(l.last_name,''));

  bod := replace(bod, '{{first_name}}', coalesce(l.first_name,''));
  bod := replace(bod, '{{last_name}}', coalesce(l.last_name,''));
  bod := replace(bod, '{{title}}', v_title);
  bod := replace(bod, '{{dates}}', dates);
  bod := replace(bod, '{{duration_days}}', coalesce(t.duration_days::text,''));
  bod := replace(bod, '{{tarif}}', coalesce(t.price_eur::text,''));
  bod := replace(bod, '{{sponsor_or_tariff}}', block);
  bod := replace(bod, '{{registration_steps}}', v_registration_steps);
  bod := replace(bod, '{{confirmation_ack}}', v_confirmation_ack);
  bod := replace(bod, '{{elearning_link}}', 'https://gepromed.sinfony.eu/');
  bod := replace(bod, '{{instructor_name}}', v_instructor_name);

  return jsonb_build_object(
    'send', true, 'to', l.email, 'subject', subj, 'body', bod,
    'body_html', wrap_email_html(bod, v_sponsor_html), 'sender', tpl.sender,
    'attachment_url', v_attachment_url, 'attachment_name', v_attachment_name
  );
end; $function$;
grant execute on function render_notification(uuid, text) to service_role;

-- ---- 2. Translate all 12 Bootcamp templates to French, lang='fr' ----
update notification_templates set lang='fr',
  subject = 'Nous avons bien reçu votre demande — {{title}}',
  body = 'Bonjour {{first_name}},

Merci d''avoir soumis votre demande d''inscription pour {{title}}, qui se déroulera à Gepromed le {{dates}}.

Nous avons bien reçu votre demande. Notre équipe va maintenant l''examiner et reviendra vers vous très prochainement.

Pour toute question en attendant, n''hésitez pas à nous contacter.

Cordialement,'
where key = 'trainee.bootcamp.request_received';

update notification_templates set lang='fr',
  subject = 'Vérification de votre éligibilité — {{title}}',
  body = 'Bonjour {{first_name}},

Merci encore pour votre intérêt pour {{title}}, qui se déroulera à Gepromed le {{dates}}.

Nous examinons actuellement les prérequis de cette formation au regard de votre profil. Nous reviendrons vers vous très prochainement pour confirmer votre éligibilité et vous communiquer les prochaines étapes de votre inscription.

Pour toute question en attendant, n''hésitez pas à nous contacter.

Cordialement,'
where key = 'trainee.bootcamp.prerequisites';

update notification_templates set lang='fr',
  subject = 'Votre demande d''inscription — {{title}}',
  body = 'Bonjour {{first_name}},

Merci beaucoup pour votre intérêt pour {{title}}, qui se déroulera à Gepromed le {{dates}}.

Nous avons le plaisir de vous informer que nous avons bien reçu votre demande d''inscription et pouvons provisoirement vous réserver votre place.

{{registration_steps}}

Pour toute question ou complément d''information, n''hésitez pas à nous contacter. N''hésitez pas non plus à partager les informations sur ce bootcamp avec vos collègues et contacts.

Cordialement,'
where key = 'trainee.bootcamp.registration';

update notification_templates set lang='fr',
  subject = 'Rappel — caution et contrat',
  body = 'Bonjour {{first_name}},

Ceci est un rappel amical concernant votre inscription à {{title}} ({{dates}}).

Pour finaliser votre place, merci de bien vouloir :
- Signer le contrat d''engagement de la formation.
- Régler la caution de 200 € : {{deposit_link}}

{{sponsor_or_tariff}}

Si vous avez déjà effectué ces démarches, merci de ne pas tenir compte de ce message.

Cordialement,'
where key = 'trainee.bootcamp.relance';

update notification_templates set lang='fr',
  subject = 'Inscription confirmée — {{title}}',
  body = 'Bonjour {{first_name}},

{{confirmation_ack}}

Nous avons le plaisir de confirmer votre inscription officielle à cet événement.

Nous reviendrons vers vous quelques semaines avant la formation avec toutes les informations pratiques nécessaires.

N''hésitez pas à nous contacter si vous avez la moindre question d''ici là.

Cordialement,'
where key = 'trainee.bootcamp.confirmation';

update notification_templates set lang='fr',
  subject = '{{title}} — Informations pratiques',
  body = 'Bonjour {{first_name}},

{{title}} approche à grands pas, et nous sommes ravis de vous accueillir très prochainement à Strasbourg ! Cet événement se déroulera le {{dates}} au centre de formation GEPROMED.

Vous trouverez le programme détaillé en pièce jointe de cet e-mail, ainsi qu''un plan pour vous aider à localiser le lieu.

INFORMATIONS PRATIQUES
GEPROMED - Bâtiment eXplora, 2 rue Marie Hamm, 67000 Strasbourg, France. L''accueil débute à 16h00, suivi des conférences à 16h30 puis d''un cocktail vers 19h00. Les ateliers débutent le lendemain matin à 8h00 précises — merci d''arriver à l''heure afin d''assurer un bon démarrage.

{{sponsor_or_tariff}}

PRÉPARATION AVANT LE BOOTCAMP
Il vous sera demandé de compléter quelques courts modules e-learning au préalable. Un e-mail séparé vous sera envoyé dès que les modules seront disponibles en ligne.

REPAS ET MOMENTS CONVIVIAUX
Vous êtes inscrit(e) aux repas et moments conviviaux prévus. Si vous avez des restrictions alimentaires ou des allergies, merci de nous en informer.

Enfin, nous vous serions reconnaissants de bien vouloir confirmer votre présence en répondant à cet e-mail. Nous nous réjouissons de partager ces journées intensives et interactives avec vous.

Cordialement,'
where key = 'trainee.bootcamp.practical_info';

update notification_templates set lang='fr',
  subject = 'Action requise — modules e-learning à compléter',
  body = 'Bonjour {{first_name}},

Nous nous réjouissons de vous accueillir à {{title}} le {{dates}}.

Avant votre arrivée, merci de compléter les modules e-learning obligatoires disponibles au lien suivant : {{elearning_link}}

Pour vous connecter :
1. Cliquez sur « Mot de passe oublié » pour générer votre mot de passe.
2. Utilisez l''adresse e-mail sur laquelle vous avez reçu ce message.

Merci de vous assurer de compléter l''ensemble des modules avant votre arrivée, car ils font partie intégrante du programme du bootcamp.

Pour toute question ou difficulté d''accès à la plateforme, n''hésitez pas à nous contacter.

Cordialement,'
where key = 'trainee.bootcamp.elearning';

update notification_templates set lang='fr',
  subject = 'Rappel — complétez votre e-learning avant le bootcamp',
  body = 'Bonjour,

Ceci est un rappel amical : {{title}} approche à grands pas — début le {{dates}} — et nous n''avons pas encore enregistré la finalisation de vos modules e-learning obligatoires.

Merci de compléter l''ensemble des modules avant votre arrivée en vous connectant sur : {{elearning_link}}

Pour rappel, lors de votre première connexion :
1. Cliquez sur « Mot de passe oublié » pour générer votre mot de passe.
2. Utilisez l''adresse e-mail sur laquelle vous avez reçu ce message.

Ces modules font partie intégrante du programme du bootcamp ; leur réalisation avant votre arrivée est donc obligatoire.

Si vous avez déjà complété les modules, merci de ne pas tenir compte de ce message. En cas de difficulté, n''hésitez pas à nous contacter — nous serons ravis de vous aider.

Au plaisir de vous accueillir très prochainement !

Cordialement,'
where key = 'trainee.bootcamp.elearning_relance';

update notification_templates set lang='fr',
  subject = 'Votre place est confirmée — {{title}}',
  body = 'Bonjour {{first_name}},

Votre place pour {{title}} à Gepromed le {{dates}} est désormais entièrement confirmée — merci d''avoir finalisé votre inscription.

Voici un rapide récapitulatif des prochaines étapes :
- Vos modules e-learning vous parviendront prochainement, si ce n''est déjà fait.
- Merci de prévoir votre voyage et votre arrivée à Strasbourg avant le premier jour.
- Notre équipe reste disponible à education@gepromed.com pour toute question d''ici là.

Nous nous réjouissons de vous accueillir à Gepromed.

Cordialement,'
where key = 'trainee.bootcamp.confirmed';

update notification_templates set lang='fr',
  subject = 'Votre caution a été remboursée — {{title}}',
  body = 'Bonjour {{first_name}},

Merci encore d''avoir participé à {{title}} à Gepromed le {{dates}}.

Nous vous confirmons que votre caution de 200 € a été remboursée, comme convenu lors de votre inscription. Merci de prévoir quelques jours ouvrés pour qu''elle apparaisse sur votre relevé, selon votre banque.

Ce fut un plaisir de vous accueillir, et nous espérons vous revoir lors d''un prochain événement Gepromed.

Cordialement,'
where key = 'trainee.bootcamp.deposit_refunded';

update notification_templates set lang='fr',
  subject = 'Merci — {{title}} + derniers modules et enquête',
  body = 'Bonjour à toutes et à tous,

Quelle édition ! Nous sommes véritablement ravis d''avoir partagé ces journées intensives avec un groupe aussi impliqué et talentueux. Cette réussite vous revient entièrement : votre énergie, votre engagement et votre participation active ont donné tout son sens à chaque instant de {{title}}. Merci sincèrement.

Quelques dernières étapes à compléter — pour finaliser votre participation, merci de prendre quelques minutes pour :
- Vous reconnecter sur la page dédiée pour accéder au module e-learning : {{elearning_link}}
- Compléter le court questionnaire post-bootcamp
- Remplir l''enquête de satisfaction : {{survey_link}}

Vos retours sont précieux : ils nous aident directement à améliorer les prochaines éditions.

Votre attestation de participation sera disponible au téléchargement dès que ces étapes seront complétées.

Merci encore pour votre confiance et votre enthousiasme.

Cordialement,'
where key = 'trainee.bootcamp.end_survey';

update notification_templates set lang='fr',
  subject = 'Votre demande d''inscription — {{title}}',
  body = 'Bonjour {{first_name}},

Merci pour votre intérêt pour {{title}} à Gepromed.

Après examen de votre demande, nous ne sommes malheureusement pas en mesure de donner suite à votre inscription pour le moment, les critères d''éligibilité de cette formation (spécialité, statut professionnel ou pays) n''étant pas remplis.

Si vous pensez qu''il s''agit d''une erreur ou souhaitez plus d''informations, n''hésitez pas à nous contacter à education@gepromed.com.

Nous vous souhaitons beaucoup de réussite dans la suite de votre parcours professionnel.

Cordialement,'
where key = 'trainee.bootcamp.eligibility_failed';

-- ---- 3. HelpMeSee: translate the two remaining English templates ----
update notification_templates set lang='fr',
  subject = 'Votre formation est confirmée — {{title}}',
  body = 'Bonjour {{first_name}},

Votre inscription pour {{title}} à Gepromed le {{dates}} est désormais entièrement confirmée.

Vos identifiants pour le simulateur ainsi que les informations pratiques vous parviendront prochainement. En attendant, merci de vous assurer de compléter les modules e-learning obligatoires avant votre arrivée.

Pour toute question avant la formation, n''hésitez pas à nous contacter à hms@gepromed.com.

Cordialement,'
where key = 'trainee.hms.confirmed';

-- ---- 4. Follow-up (same session, live QA caught two more instances) ----
-- 4a. wrap_email_html() footer disclaimer was still English ("You are
--     receiving this email..."); translated to French.
-- 4b. The {{dates}} date-range separator used ' - ' (another instance of
--     the flagged dash pattern, e.g. "22/09/2026 - 24/09/2026"). Changed to
--     ' au ' ("22/09/2026 au 24/09/2026") — natural French, and compatible
--     with every template's existing "le {{dates}}" phrasing (an earlier
--     attempt to prefix with "du " broke that phrasing: "le du 22/09/2026
--     au 24/09/2026").
-- Both folded into render_notification() (section 1 above, already updated
-- to the final state) and wrap_email_html() (footer fix, not repeated here
-- — see db/notification_render.sql, which reflects the final live state).
--
-- 4c. Training titles themselves used an em dash as a subtitle separator
--     ("Abord vasculaire périphérique — module avancé"), which is data in
--     `trainings.title`, not template content — same AI-sounding pattern,
--     different table. Replaced " — " with " : " across all 7 affected
--     trainings (both fr/en), e.g. "Abord vasculaire périphérique : module
--     avancé" / "Peripheral vascular access: advanced module". Also fixed
--     a stray missing-accent typo while touching that row ("Avance" →
--     "Avancé" in "Bootcamp Vasculaire Avancé"). Ad hoc UPDATE, not
--     re-run from this file — see chat history for the exact statements if
--     this needs reapplying to a fresh environment.
