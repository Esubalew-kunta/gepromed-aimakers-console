-- ============================================================================
-- Phase 3 — verbatim trainee email bodies (from Nicole's "Lead journey emails"
-- Notion page), with {{merge_fields}} for the XX / DD MM / *Training Name*
-- placeholders. Copy lives here so staff edit wording without touching n8n
-- (Master Plan Decision 2). Dollar-quoted ($body$) so apostrophes need no escaping.
-- trainee.hms.credentials stays inactive until the client provides copy.
-- Merge fields: {{first_name}} {{last_name}} {{title}} {{dates}} {{duration_days}}
--   {{tarif}} {{deposit_link}} {{elearning_link}} {{survey_link}} {{instructor_name}}
--   {{instructor_phone}} {{sponsor_or_tariff}} {{date_options}}
-- Run in the SQL editor of project hdvqiiprylrrzrkydtpa.
-- ============================================================================

-- ---------- HelpMeSee (hms@gepromed.com) ----------
update notification_templates set body = $body$Bonjour Dr. {{last_name}},

Nous avons bien pris connaissance de votre demande d'inscription à notre formation en chirurgie de la cataracte sur simulateurs à réalité virtuelle, et nous vous remercions vivement de l'intérêt que vous portez à nos programmes de formation.

Afin de pouvoir adapter notre proposition à vos besoins et à votre profil, nous vous demandons de bien vouloir compléter le document ci-joint et de nous le retourner dans les meilleurs délais.

Nous restons bien entendu à votre entière disposition pour toute question complémentaire ou demande d'information, et nous nous ferons un plaisir de vous accompagner dans votre démarche.

Dans l'attente de votre retour, nous vous adressons nos cordiales salutations.$body$ where key='trainee.hms.enrollment_request';

update notification_templates set body = $body$Bonjour Dr. {{last_name}},

Je vous remercie pour le retour du document complété, ainsi que pour les informations détaillées que vous y avez apportées.

Après analyse de votre dossier, je suis en mesure de vous proposer les semaines de formation suivantes :

{{date_options}}

Pourriez-vous me faire part de la semaine qui conviendrait le mieux à votre planning ?

Dès réception de votre retour, nous pourrons procéder à la confirmation de votre inscription et vous faire parvenir toutes les informations pratiques nécessaires.

Nous restons disponibles pour toute question complémentaire.

Bien cordialement,$body$ where key='trainee.hms.date_proposals';

update notification_templates set body = $body$Bonjour Dr. {{last_name}},

Je vous remercie pour votre retour et me réjouis que la semaine du {{dates}} vous convienne. Je retiens donc cette date pour votre formation.

Au regard de votre expérience, nous avons pensé adapter le programme sur {{duration_days}} jours afin de vous offrir un accompagnement pleinement personnalisé. Cette formule comprend un entraînement unique avec un simulateur dédié et un instructeur attitré, pour un tarif de {{tarif}} €.

Concernant le règlement, nous pouvons vous proposer un paiement échelonné selon les modalités qui vous conviendraient le mieux, à condition que l'intégralité de la somme soit réglée avant la date de début de la formation.

Pourriez-vous me faire part de vos préférences à ce sujet ? Nous vous ferons alors parvenir la facture ainsi que les modalités de règlement détaillées.

Restant à votre disposition pour toute question,$body$ where key='trainee.hms.confirmation';

update notification_templates set body = $body$Dear {{first_name}},

We are delighted to welcome you to the upcoming HelpMeSee {{title}} training, which will take place over {{duration_days}} days: {{dates}}.

VENUE
EXplora building, 2 Rue Marie Hamm, 67000 Strasbourg, France

SCHEDULE
The course runs from 9:00 AM to approximately 5:00 PM each day. We kindly invite you to arrive from 8:45 AM so we can welcome you and get you settled before the session begins. A lunch break of 45 minutes to 1 hour will be organized on our end.

YOUR INSTRUCTOR
Your instructor will be Dr. {{instructor_name}}, who will be guiding you throughout the training. Should you have any difficulty accessing the venue or any questions prior to the training, please do not hesitate to reach out to him directly ({{instructor_phone}}).

E-LEARNING PREREQUISITE - ACTION REQUIRED
Completing the e-learning modules is a mandatory prerequisite to attending the on-site training. Please complete all modules before your arrival.

SIMULATOR CREDENTIALS
Your simulator credentials have already been created. We will share them with you as soon as your e-learning modules have been completed.

We look forward to seeing you in Strasbourg and wish you an enriching training experience!

Warm regards,$body$ where key='trainee.hms.practical_info';

update notification_templates set body = $body$Dear {{first_name}},

We are thrilled that you joined the {{title}} training ({{dates}}) — we hope it was a valuable experience!

Your feedback matters greatly to us and will directly shape our future training programs. We would appreciate it if you could take a few minutes to complete the end-of-course survey.

Access the survey here: {{survey_link}}

The survey covers the overall course effectiveness, the quality of learning materials, instructor feedback, and how the training will support you in live surgery settings.

Should you experience any issues, don't hesitate to reach out — we're happy to help!

Best regards,$body$ where key='trainee.hms.satisfaction';

-- ---------- Bootcamps & Workshops (education@gepromed.com) ----------
-- Fires immediately on form submit (stage='lead'), before staff touch the
-- lead — acknowledges receipt so the trainee isn't left wondering.
update notification_templates set body = $body$Dear {{first_name}},

Thank you for submitting your registration request for the {{title}}, which will take place at Gepromed on {{dates}}.

We successfully received your request and our team will now begin reviewing your profile against the training prerequisites. We will come back to you shortly with an update.

If you have any questions in the meantime, please do not hesitate to contact us.

Best regards,$body$ where key='trainee.bootcamp.request_received';

-- Inactive: kept only so the 'prerequisites' stage_enter slot is documented;
-- would duplicate request_received's message if both were active.
update notification_templates set body = $body$Dear {{first_name}},

Thank you for submitting your registration request for the {{title}}, which will take place at Gepromed on {{dates}}.

We are currently reviewing the prerequisites for this training against your profile. We will come back to you shortly to confirm your eligibility and share the next steps to finalize your registration.

If you have any questions in the meantime, please do not hesitate to contact us.

Best regards,$body$ where key='trainee.bootcamp.prerequisites';

update notification_templates set body = $body$Dear {{first_name}},

This is a friendly reminder regarding your registration for {{title}} ({{dates}}).

To finalize your spot, please complete the following:
- Sign the training commitment agreement.
- Pay the €200 deposit: {{deposit_link}}

{{sponsor_or_tariff}}

If you have already completed these steps, please disregard this message.

Best regards,$body$ where key='trainee.bootcamp.relance';

update notification_templates set body = $body$Dear {{first_name}},

Thank you very much for your interest in the {{title}}, which will be held at Gepromed on {{dates}}.

We are pleased to inform you that we have received your registration request and can provisionally confirm your spot. Please note that your registration will be finalized once the following administrative steps are completed:

- Signing the training commitment agreement (attached).
- Paying a €200 deposit via the online link below: {{deposit_link}}

This deposit is fully refundable at the end of the training. It was introduced to help minimize last-minute cancellations and ensure smooth logistics for all participants.

{{sponsor_or_tariff}}

If you have any questions or require further information, please do not hesitate to contact me. You are also welcome to share information about the bootcamp with your colleagues and contacts.

Best regards,$body$ where key='trainee.bootcamp.registration';

update notification_templates set body = $body$Dear {{first_name}},

I acknowledge receipt of your signed contract as well as the deposit payment for the {{title}}, which will take place at Gepromed on {{dates}}.

I am pleased to confirm your official registration for this event.

I will get back to you a few weeks before the course with all the practical information you may need.

Please do not hesitate to contact me if you have any questions in the meantime.

Best regards,$body$ where key='trainee.bootcamp.confirmation';

update notification_templates set body = $body$Dear {{first_name}},

The {{title}} is fast approaching, and we are delighted to welcome you to Strasbourg very soon! This event will take place on {{dates}} at the GEPROMED Education Center.

You will find the detailed program attached to this email, along with a map to help you locate the venue.

PRACTICAL INFORMATION
GEPROMED - eXplora building, 2 rue Marie Hamm, 67000 Strasbourg, France. The welcome reception starts at 4:00 PM, followed by lectures at 4:30 PM and a cocktail reception around 7:00 PM. Workshops begin the next morning at 8:00 AM sharp — please arrive on time to ensure a smooth start.

Could you please confirm your current year of residency?

{{sponsor_or_tariff}}

PREPARATION BEFORE THE BOOTCAMP
You will be asked to complete a few short e-learning modules beforehand. A separate email will be sent to you as soon as the modules are available online.

MEALS AND SOCIAL EVENTS
You are registered for the planned meals and social gatherings. If you have any dietary restrictions or allergies, please let us know.

Finally, we would be grateful if you could kindly confirm your attendance by replying to this email. We look forward to sharing these intensive and interactive days with you.

Warm regards,$body$ where key='trainee.bootcamp.practical_info';

update notification_templates set body = $body$Dear participant,

We are looking forward to welcoming you at the {{title}} on {{dates}}.

Before your arrival, please complete the mandatory e-learning modules available at the following link: {{elearning_link}}

To log in:
1. Click on "Forgot password" to generate your password.
2. Use the email address on which you received this message.

Please make sure to complete all modules prior to your arrival, as they are an essential part of the bootcamp curriculum.

Should you have any questions or encounter any difficulties accessing the platform, do not hesitate to contact us.

Best regards,$body$ where key='trainee.bootcamp.elearning';

update notification_templates set body = $body$Dear participant,

This is a friendly reminder that the {{title}} is just a few days away — starting {{dates}} — and we have not yet recorded your completion of the mandatory e-learning modules.

Please make sure to complete all modules before your arrival by logging in at: {{elearning_link}}

As a reminder, for the first log in:
1. Click on "Forgot password" to generate your password.
2. Use the email address on which you received this message.

These modules are an essential part of the bootcamp curriculum, so your completion prior to arrival is required.

If you have already completed the modules, please disregard this message. If you are experiencing any difficulties, do not hesitate to reach out — we are happy to help.

We look forward to seeing you soon!

Best regards,$body$ where key='trainee.bootcamp.elearning_relance';

update notification_templates set body = $body$Dear participants,

What an edition! We are truly thrilled to have shared these intensive days with such a committed and talented group. This success belongs entirely to you: your energy, dedication, and active engagement made every moment of this {{title}} meaningful. Thank you, sincerely.

A few quick steps to complete — to finalize your participation, please take a few minutes to:
- Log back onto the dedicated webpage to access the e-learning module: {{elearning_link}}
- Complete the short post-bootcamp questionnaire
- Fill in the satisfaction survey: {{survey_link}}

Your feedback is invaluable: it directly helps us raise the bar for future editions.

Your certificate of participation will be available to download as soon as these steps are completed.

Thank you once again for your trust and your enthusiasm.

Warm regards,$body$ where key='trainee.bootcamp.end_survey';
