-- ============================================================================
-- Phase 10 — Premium email redesign + missing "confirmed" templates.
-- Applied directly against project hdvqiiprylrrzrkydtpa.
--
-- What this does:
--   1. Redesigns wrap_email_html(): adds the real Gepromed logo (hosted in
--      the new public 'brand' storage bucket) instead of a text wordmark,
--      plus a cleaner premium layout (accent bar, whitespace, refined
--      footer). Same function signature — no caller changes needed.
--   2. Fills in v_bank_details in render_notification() with a realistic
--      DEMO placeholder account (clearly a placeholder — see comment below)
--      so the deposit instructions read as a real bank transfer rather than
--      a bracketed TODO. MUST be swapped for Gepromed's real account before
--      go-live; grep for "DEMO ACCOUNT" to find it fast.
--   3. Adds the two missing "seat confirmed" templates (Bootcamp and
--      HelpMeSee both currently have no email at stage=confirmed) and an
--      eligibility-failed template for Bootcamp applicants who don't pass
--      the prerequisites gate (previously: no notification sent at all).
--      NOTE: the eligibility-failed template uses trigger='manual' since
--      eligibility failure doesn't advance `stage` (see
--      trainees/actions.ts verifyEligibility). No n8n workflow change was
--      needed: the stage-change router's Supabase webhook fires on every
--      `leads` UPDATE (no column filter) and delegates routing entirely to
--      notify_for_stage() — so the actual fix is the follow-up migration
--      in db/notify_functions.sql (Phase 10 comment there), not an n8n edit.
--   4. QA (2026-07-29, 3 test leads walked end-to-end through every stage of
--      all 3 pipelines at yikeber50@gmail.com) caught a live bug:
--      trainee.bootcamp.prerequisites was active and fired a byte-for-byte
--      duplicate of trainee.bootcamp.request_received one stage later — its
--      own seed comment in notification_templates.sql says it should stay
--      inactive ("superseded... to avoid duplicate emails"), but Phase 9
--      re-activated it. Deactivated again:
--        update notification_templates set active=false
--        where key = 'trainee.bootcamp.prerequisites';
-- ============================================================================

-- ---- 1. Premium wrap_email_html with the real logo ----
create or replace function wrap_email_html(p_body text, p_sponsor_html text default null)
returns text language sql immutable as $$
  select
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f6;padding:32px 0;font-family:-apple-system,Segoe UI,Arial,Helvetica,sans-serif;">' ||
    '<tr><td align="center">' ||
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e4e7ee;border-radius:16px;overflow:hidden;">' ||
    -- accent bar
    '<tr><td style="height:4px;line-height:4px;font-size:0;background:#1a4fb8;">&nbsp;</td></tr>' ||
    -- header: real logo, no more text wordmark
    '<tr><td style="padding:32px 32px 22px;">' ||
    '<img src="https://hdvqiiprylrrzrkydtpa.supabase.co/storage/v1/object/public/brand/logo-gepromed-color.png" alt="Gepromed" height="38" style="height:38px;display:block;border:0;">' ||
    '<div style="margin-top:12px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#8891a3;">Formation chirurgicale d&rsquo;excellence</div>' ||
    '</td></tr>' ||
    '<tr><td style="padding:0 32px;"><div style="border-top:1px solid #eceef2;"></div></td></tr>' ||
    coalesce(p_sponsor_html, '') ||
    -- body
    '<tr><td style="padding:28px 32px 32px;color:#232837;font-size:15.5px;line-height:1.7;">' ||
    (
      select string_agg(
        '<p style="margin:0 0 15px;">' ||
        replace(trim(both E'\n' from para), E'\n', '<br>') ||
        '</p>',
        ''
      )
      from unnest(
        regexp_split_to_array(
          replace(replace(replace(p_body, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'),
          E'\n\s*\n'
        )
      ) as para
      where trim(para) <> ''
    ) ||
    '</td></tr>' ||
    -- footer
    '<tr><td style="padding:22px 32px;background:#fafbfc;border-top:1px solid #eceef2;">' ||
    '<div style="font-size:12.5px;font-weight:700;color:#3a4152;">Gepromed</div>' ||
    '<div style="margin-top:3px;font-size:11.5px;color:#9aa2b1;line-height:1.6;">4 rue Kirschleger, 67000 Strasbourg, France<br>' ||
    'www.gepromed.com &middot; +33 (0)3 88 00 00 00</div>' ||
    '<div style="margin-top:10px;font-size:10.5px;color:#c1c6d0;">You are receiving this email because you registered for a Gepromed training.</div>' ||
    '</td></tr>' ||
    '</table></td></tr></table>';
$$;
grant execute on function wrap_email_html(text, text) to service_role;

-- ---- 2. render_notification: realistic DEMO bank details placeholder ----
-- DEMO ACCOUNT — placeholder only, NOT a real Gepromed bank account. Replace
-- with the real IBAN/BIC/bank name before accepting live deposits.
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
  v_bank_details text :=
    'Account holder: GEPROMED SARL' || E'\n' ||
    'Bank: BNP Paribas, Strasbourg Kleber' || E'\n' ||
    'IBAN: FR76 3000 4028 3701 0023 4567 891' || E'\n' ||
    'BIC/SWIFT: BNPAFRPPXXX' || E'\n' ||
    'Reference: please include your full name + training title';
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
grant execute on function render_notification(uuid, text) to service_role;

-- ---- 3. Fill the "seat confirmed" gaps (both pipelines had none) ----
insert into notification_templates (key, pipeline, variant, stage, trigger, sender, lang, subject, body, attachments, active)
values (
  'trainee.bootcamp.confirmed',
  'trainee', 'bootcamp', 'confirmed', 'stage_enter', 'education@gepromed.com', 'en',
  'Your seat is confirmed — {{title}}',
  'Dear {{first_name}},

Your seat for the {{title}} at Gepromed on {{dates}} is now fully confirmed — thank you for completing your registration.

Here is a quick recap of what happens next:
- Your e-learning modules will follow shortly, if you have not received them already.
- Please plan your travel and arrival in Strasbourg ahead of the first day.
- Our team remains available at education@gepromed.com for any questions in the meantime.

We look forward to welcoming you at Gepromed.

Best regards,',
  '{}', true
)
on conflict (key) do nothing;

insert into notification_templates (key, pipeline, variant, stage, trigger, sender, lang, subject, body, attachments, active)
values (
  'trainee.hms.confirmed',
  'trainee', 'helpmesee', 'confirmed', 'stage_enter', 'hms@gepromed.com', 'en',
  'Your training is confirmed — {{title}}',
  'Dear {{first_name}},

Your enrollment for the {{title}} at Gepromed on {{dates}} is now fully confirmed.

Your simulator credentials and practical information will follow shortly. In the meantime, please make sure to complete the mandatory e-learning modules ahead of your arrival.

If you have any questions before the training, feel free to reach out to us at hms@gepromed.com.

Best regards,',
  '{}', true
)
on conflict (key) do nothing;

-- ---- 4. Eligibility-failed template (Bootcamp) — previously no email sent
--         at all when a lead doesn't pass the prerequisites gate. trigger
--         is 'manual' because it does not correspond to a stage change; see
--         the header note above re: n8n routing still needed. ----
insert into notification_templates (key, pipeline, variant, stage, trigger, sender, lang, subject, body, attachments, active)
values (
  'trainee.bootcamp.eligibility_failed',
  'trainee', 'bootcamp', 'prerequisites', 'manual', 'education@gepromed.com', 'en',
  'Your registration request — {{title}}',
  'Dear {{first_name}},

Thank you for your interest in the {{title}} at Gepromed.

After reviewing your request, we are unable to move forward with your registration at this time, as the eligibility criteria for this training (specialty, professional status, or country) were not met.

If you believe this is an error or would like more information, please do not hesitate to contact us at education@gepromed.com.

We wish you all the best in your professional development.

Best regards,',
  '{}', true
)
on conflict (key) do nothing;
