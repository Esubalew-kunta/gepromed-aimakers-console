-- ============================================================================
-- Points the bootcamp "registration request" email at the actual upload link
-- instead of "reply to this email with a screenshot" — trainees now sign the
-- contract and pay the deposit, then upload BOTH the signed contract and a
-- payment-receipt screenshot at {{sign_link}} (gepromed-web's /sign?ref=...
-- page, extended for dual upload — see components/SignUpload.tsx and
-- db/trainee_document_upload_v2.sql, which MUST be applied first: this
-- template text tells the trainee to use a link that only works with that
-- migration's 3-arg submit_signed_document()).
--
-- WEB_BASE_URL points at gepromed-web's current Render deployment
-- (https://gepromed-demo.onrender.com, per render.yaml's service name). Swap
-- for a custom domain once one is set up for gepromed-web (same convention as
-- v_bank_details' DEMO ACCOUNT placeholder above it).
--
-- Run in the Supabase SQL editor (project aablleekwyjqdxsscyeo), AFTER
-- trainee_document_upload_v2.sql. SAFE + IDEMPOTENT — re-runnable; only
-- touches render_notification (CREATE OR REPLACE).
-- ============================================================================
begin;

create or replace function render_notification(p_lead uuid, p_template_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare tpl record; l record; t record; subj text; bod text; block text; dates text;
  v_sponsor_name text; v_registration_steps text; v_confirmation_ack text; v_sponsor_html text;
  v_attachment_url text; v_attachment_name text; ct record;
  v_instructor_name text; v_title text; v_title_esc text; v_body_html text; v_sign_link text;
  -- DEMO ACCOUNT — placeholder only, NOT a real Gepromed bank account.
  v_bank_details text :=
    'Titulaire du compte : GEPROMED SARL' || E'\n' ||
    'Banque : BNP Paribas, Strasbourg Kléber' || E'\n' ||
    'IBAN : FR76 3000 4028 3701 0023 4567 891' || E'\n' ||
    'BIC/SWIFT : BNPAFRPPXXX' || E'\n' ||
    'Référence : merci d''indiquer votre nom complet + l''intitulé de la formation';
  -- WEB_BASE_URL — gepromed-web's current Render deployment.
  v_web_base_url text := 'https://gepromed-demo.onrender.com';
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
  v_sign_link := v_web_base_url || '/sign?ref=' || l.ref;

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
      '- Régler une caution de 200 € par virement bancaire sur le compte ci-dessous :' || E'\n\n' ||
      v_bank_details || E'\n\n' ||
      '- Puis téléverser ici votre contrat signé ET une capture d''écran de votre justificatif de virement : ' || v_sign_link || E'\n\n' ||
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
  bod := replace(bod, '{{sign_link}}', v_sign_link);

  v_body_html := wrap_email_html(bod, v_sponsor_html);

  if v_title <> '' then
    v_title_esc := replace(replace(replace(v_title, '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
    v_body_html := replace(
      v_body_html,
      v_title_esc,
      '<strong style="color:#1a4fb8;">' || v_title_esc || '</strong>'
    );
  end if;

  return jsonb_build_object(
    'send', true, 'to', l.email, 'subject', subj, 'body', bod,
    'body_html', v_body_html, 'sender', tpl.sender,
    'attachment_url', v_attachment_url, 'attachment_name', v_attachment_name
  );
end; $$;
grant execute on function render_notification(uuid, text) to service_role;

commit;
