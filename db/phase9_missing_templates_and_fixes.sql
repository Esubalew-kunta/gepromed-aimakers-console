-- ============================================================================
-- Phase 9 — trainee email journey: missing templates + real-data fixes.
-- Applied directly against project hdvqiiprylrrzrkydtpa (2026-07-24/25).
--
-- Context: end-to-end testing of the trainee (leads) automated email journey
-- surfaced three gaps, all fixed here:
--   1. Three pipeline stages had no email at all (or a drafted-but-disabled
--      one): HelpMeSee simulator_access, Bootcamp deposit_refunded, Bootcamp
--      prerequisites.
--   2. The Bootcamp/HelpMeSee "practical info" email referenced
--      {{instructor_name}} / {{instructor_phone}} merge fields that
--      render_notification() never populated — real emails were sending the
--      literal, unreplaced "{{instructor_name}}" text. Fixed by wiring
--      {{instructor_name}} to the training's own `supervisors` data (no
--      instructor phone number exists anywhere in the schema, so that
--      reference was removed from the copy rather than left broken).
--   3. The HelpMeSee "confirmation" email was configured to attach an
--      invoice file, but no invoice-file system exists (render_notification
--      only ever implemented attachment support for the engagement
--      contract). Removed the unfulfillable `attachments` promise rather
--      than build an invoice-document system nobody has asked for; the
--      email's own copy already correctly says the invoice follows
--      separately, so this is a metadata-only correction with no visible
--      change to what participants receive.
-- ============================================================================

-- ---- 1. Fill in + activate the HelpMeSee simulator credentials email ----
update notification_templates
set body = 'Dear {{first_name}},

Great news — you now have access to the cataract surgery simulator platform for your upcoming training, {{title}}.

You can log in here: {{elearning_link}}

Please take some time to familiarize yourself with the simulator ahead of your session — this will help you get the most out of your time at Gepromed. If you run into any access issues, just reply to this email and we''ll sort it out quickly.

Best regards,',
    active = true
where key = 'trainee.hms.credentials';

-- ---- 2. New Bootcamp deposit-refunded email ----
insert into notification_templates (key, pipeline, variant, stage, trigger, sender, lang, subject, body, attachments, active)
values (
  'trainee.bootcamp.deposit_refunded',
  'trainee', 'bootcamp', 'deposit_refunded', 'stage_enter', 'education@gepromed.com', 'en',
  'Your deposit has been refunded — {{title}}',
  'Dear {{first_name}},

Thank you again for attending the {{title}} at Gepromed on {{dates}}.

We''re writing to confirm that your EUR 200 deposit has been refunded, as agreed when you registered. Please allow a few business days for it to appear on your statement, depending on your bank.

It was a pleasure having you with us, and we hope to see you again at a future Gepromed event.

Best regards,',
  '{}', true
)
on conflict (key) do nothing;

-- ---- 3. Activate the existing (already-drafted) Bootcamp prerequisites email ----
update notification_templates set active = true where key = 'trainee.bootcamp.prerequisites';

-- ---- 4. Fix the HelpMeSee practical_info body: remove the unfulfillable
--         instructor-phone reference and the duplicate "Dr." (the real
--         instructor name pulled in below already includes the title) ----
update notification_templates
set body = 'Dear {{first_name}},

We are delighted to welcome you to the upcoming HelpMeSee {{title}} training, which will take place over {{duration_days}} days: {{dates}}.

VENUE
EXplora building, 2 Rue Marie Hamm, 67000 Strasbourg, France

SCHEDULE
The course runs from 9:00 AM to approximately 5:00 PM each day. We kindly invite you to arrive from 8:45 AM so we can welcome you and get you settled before the session begins. A lunch break of 45 minutes to 1 hour will be organized on our end.

YOUR INSTRUCTOR
Your instructor will be {{instructor_name}}, who will be guiding you throughout the training. Should you have any difficulty accessing the venue or any questions prior to the training, please do not hesitate to reach out to us at hms@gepromed.com.

E-LEARNING PREREQUISITE - ACTION REQUIRED
Completing the e-learning modules is a mandatory prerequisite to attending the on-site training. Please complete all modules before your arrival.

SIMULATOR CREDENTIALS
Your simulator credentials have already been created. We will share them with you as soon as your e-learning modules have been completed.

We look forward to seeing you in Strasbourg and wish you an enriching training experience!

Warm regards,'
where key = 'trainee.hms.practical_info';

-- ---- 5. Remove the unfulfillable "invoice" attachment promise (no
--         invoice-file system exists; the copy already says it follows
--         separately) ----
update notification_templates
set attachments = '{}'
where key = 'trainee.hms.confirmation';

-- ---- 6. render_notification(): populate {{instructor_name}} from the
--         training's own `supervisors` data (first supervisor's name),
--         falling back to a generic phrase if none is set. This is the only
--         change to the function body vs. the version in notification_render.sql
--         — everything else (sponsor handling, contract attachment, merge
--         fields) is unchanged. ----
CREATE OR REPLACE FUNCTION public.render_notification(p_lead uuid, p_template_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare tpl record; l record; t record; subj text; bod text; block text; dates text;
  v_sponsor_name text; v_registration_steps text; v_confirmation_ack text; v_sponsor_html text;
  v_attachment_url text; v_attachment_name text; ct record;
  v_instructor_name text;
  v_bank_details text := '[BANK DETAILS TO BE CONFIRMED — account holder, IBAN, BIC/SWIFT, bank name]';
begin
  select * into tpl from notification_templates where key = p_template_key and active limit 1;
  if not found then return jsonb_build_object('send', false, 'reason', 'template inactive/missing'); end if;
  select * into l from leads where id = p_lead;
  if not found then return jsonb_build_object('send', false, 'reason', 'lead missing'); end if;
  select * into t from trainings where id = l.training_id;

  dates := coalesce(to_char(t.start_date, 'DD/MM/YYYY'), '')
    || case when t.end_date is not null and t.end_date <> t.start_date
            then ' - ' || to_char(t.end_date, 'DD/MM/YYYY') else '' end;

  v_sponsor_name := (select string_agg(s->>'name', ', ') from jsonb_array_elements(coalesce(t.sponsors,'[]'::jsonb)) s);

  v_instructor_name := coalesce(
    (select s->>'name' from jsonb_array_elements(coalesce(t.supervisors,'[]'::jsonb)) s limit 1),
    'a member of our pedagogical team'
  );

  if coalesce(t.is_sponsored, false) then
    block := 'Sponsorisé : ' || coalesce(v_sponsor_name, 'labo(s)');
    v_registration_steps :=
      'Your seat is fully funded by ' || coalesce(v_sponsor_name, 'our sponsor') ||
      ' -- no deposit or commitment contract is required from you. Your registration is confirmed directly.';
    v_confirmation_ack :=
      'Your registration for the ' || coalesce(t.title->>'en', t.title->>'fr', '') ||
      ', which will take place at Gepromed on ' || dates ||
      ', is confirmed -- no deposit or contract required, as your seat is funded by ' ||
      coalesce(v_sponsor_name, 'our sponsor') || '.';

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
      '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#7c6ff0;font-weight:bold;">Training funded by</div>' ||
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
      '- Signing the training commitment agreement (attached).' || E'\n' ||
      '- Paying a EUR200 deposit by bank transfer to the account below, then replying to this email with a screenshot or receipt of the transfer as proof of payment (deposits are verified manually):' || E'\n\n' ||
      v_bank_details || E'\n\n' ||
      'This deposit is fully refundable at the end of the training. It was introduced to help minimize last-minute cancellations and ensure smooth logistics for all participants.';
    v_confirmation_ack :=
      'I acknowledge receipt of your signed contract as well as the deposit payment for the ' ||
      coalesce(t.title->>'en', t.title->>'fr', '') || ', which will take place at Gepromed on ' || dates || '.';
    v_sponsor_html := null;
  end if;

  -- Resolve a real file attachment when this template calls for the signed
  -- engagement contract AND the lead already has one matched. Gated on
  -- "not sponsored" explicitly (not just "contract_template_id is not
  -- null"), since a sponsored lead can still carry a stale contract_template_id
  -- from before the auto_attach_contract sponsor fix -- text and attachment
  -- must agree, not just the text.
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

  subj := replace(replace(replace(subj, '{{title}}', coalesce(t.title->>'fr','')),
                          '{{first_name}}', coalesce(l.first_name,'')),
                  '{{last_name}}', coalesce(l.last_name,''));

  bod := replace(bod, '{{first_name}}', coalesce(l.first_name,''));
  bod := replace(bod, '{{last_name}}', coalesce(l.last_name,''));
  bod := replace(bod, '{{title}}', coalesce(t.title->>'fr',''));
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
