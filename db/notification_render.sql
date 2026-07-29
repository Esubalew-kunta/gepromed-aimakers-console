-- ============================================================================
-- Phase 3 n8n helpers: log_email_once (idempotency) + render_notification
-- (server-side merge-field rendering, so the n8n workflows stay simple and the
-- rendering is testable in SQL). Project: hdvqiiprylrrzrkydtpa.
--
-- Kept in sync with what's actually deployed (this file has drifted from
-- prod more than once already — apply changes live AND update this file in
-- the same change, or it drifts again).
-- ============================================================================

-- 1. Idempotent email logging (returns {"send": bool}). p_daily=true => once/day.
create or replace function log_email_once(
  p_lead uuid, p_template text, p_to text, p_daily boolean default false
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_exists boolean;
begin
  if p_daily then
    select exists(select 1 from email_log where lead_id=p_lead and template=p_template
      and (sent_at at time zone 'Europe/Paris')::date = (now() at time zone 'Europe/Paris')::date) into v_exists;
  else
    select exists(select 1 from email_log where lead_id=p_lead and template=p_template) into v_exists;
  end if;
  if v_exists then return jsonb_build_object('send', false); end if;
  insert into email_log (lead_id, template, to_email, status) values (p_lead, p_template, p_to, 'sent');
  return jsonb_build_object('send', true);
end; $$;
grant execute on function log_email_once(uuid, text, text, boolean) to service_role;

-- 2b. Wraps a plain-text body (staff edits plain wording, no HTML) into a
-- branded HTML email shell at render/send time — same visual style as the
-- Phase-1 templates (blue header bar, white card). Blank lines become
-- paragraph breaks, single line breaks become <br>. Never touches storage,
-- only the outgoing render, so non-technical staff keep editing plain text.
--
-- p_sponsor_html: optional extra HTML block (the sponsor logo/name badge,
-- built by render_notification when the training is sponsored) rendered as
-- its own row right under the header, above the letter body. Null/absent for
-- non-sponsored trainings — fully backward compatible.
-- Phase 10 (2026-07-29): premium redesign — real Gepromed logo (hosted in
-- the public 'brand' storage bucket, since email clients need a public
-- <img> URL, not a local file path) instead of a text wordmark, plus a
-- cleaner premium layout (accent bar, refined footer). Same signature.
-- Phase 11 (2026-07-29): footer disclaimer translated to French (was the
-- last English string in the shell after Phase 11's template translation).
create or replace function wrap_email_html(p_body text, p_sponsor_html text default null)
returns text language sql immutable as $$
  select
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f6;padding:32px 0;font-family:-apple-system,Segoe UI,Arial,Helvetica,sans-serif;">' ||
    '<tr><td align="center">' ||
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e4e7ee;border-radius:16px;overflow:hidden;">' ||
    '<tr><td style="height:4px;line-height:4px;font-size:0;background:#1a4fb8;">&nbsp;</td></tr>' ||
    '<tr><td style="padding:32px 32px 22px;">' ||
    '<img src="https://hdvqiiprylrrzrkydtpa.supabase.co/storage/v1/object/public/brand/logo-gepromed-color.png" alt="Gepromed" height="38" style="height:38px;display:block;border:0;">' ||
    '<div style="margin-top:12px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#8891a3;">Formation chirurgicale d&rsquo;excellence</div>' ||
    '</td></tr>' ||
    '<tr><td style="padding:0 32px;"><div style="border-top:1px solid #eceef2;"></div></td></tr>' ||
    coalesce(p_sponsor_html, '') ||
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
    '<tr><td style="padding:22px 32px;background:#fafbfc;border-top:1px solid #eceef2;">' ||
    '<div style="font-size:12.5px;font-weight:700;color:#3a4152;">Gepromed</div>' ||
    '<div style="margin-top:3px;font-size:11.5px;color:#9aa2b1;line-height:1.6;">4 rue Kirschleger, 67000 Strasbourg, France<br>' ||
    'www.gepromed.com &middot; +33 (0)3 88 00 00 00</div>' ||
    '<div style="margin-top:10px;font-size:10.5px;color:#c1c6d0;">Vous recevez cet e-mail car vous êtes inscrit(e) à une formation Gepromed.</div>' ||
    '</td></tr>' ||
    '</table></td></tr></table>';
$$;

-- 2. Render a template for a lead: fills the DB-derivable merge fields and
-- returns {send, to, subject, body, body_html, sender, attachment_url,
-- attachment_name}. body stays plain text (what staff edited); body_html is
-- the branded version n8n actually sends.
--
-- Sponsored vs self-funded trainings get genuinely different content, not
-- just a cosmetic label swap:
--   - {{registration_steps}} / {{confirmation_ack}}: sponsored trainees are
--     told their seat is fully funded, no deposit/contract required, seat
--     confirmed directly. Self-funded trainees get the deposit + contract
--     ask, with the deposit paid by bank transfer (verified manually — the
--     trainee replies with a screenshot/receipt) since there's no online
--     payment link/provider wired up yet. v_bank_details is a literal
--     placeholder until the real account details are supplied.
--   - v_sponsor_html: a visual logo+name badge (or an initials chip when no
--     logo is set) shown under the email header for sponsored trainings,
--     instead of only a plain-text sponsor mention.
--   - attachment_url/attachment_name: resolved from the lead's matched
--     contract_template_id (contract_templates.file_url in the public
--     'contracts' storage bucket) ONLY when the template calls for the
--     engagement_contract attachment AND the training isn't sponsored (a
--     sponsored lead can still carry a stale contract_template_id from
--     before the auto_attach_contract sponsor fix, so this is gated
--     explicitly rather than relying on that column alone).
-- Phase 9 (2026-07-24/25): added {{instructor_name}} (from the training's
-- own `supervisors` data). Phase 10 (2026-07-29): filled v_bank_details with
-- a realistic DEMO placeholder account (grep "DEMO ACCOUNT" — NOT real,
-- must be swapped for Gepromed's actual account before go-live).
-- Phase 11 (2026-07-29): all dynamic strings rewritten in French (Gepromed
-- writes to French-speaking trainees by default; all 12 Bootcamp templates
-- + trainee.hms.confirmed were translated from English in the same phase),
-- and the " -- " literal-double-hyphen dash pattern removed — it read as
-- AI-generated. v_title now prefers the French title (was English-first).
-- Phase 12 (2026-07-29): the training title is now bolded + brand-blue
-- everywhere it appears in the rendered body (UX: easy to scan in a long
-- transactional email), via a post-escape string replace on the title text
-- against the already-built body_html.
create or replace function render_notification(p_lead uuid, p_template_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare tpl record; l record; t record; subj text; bod text; block text; dates text;
  v_sponsor_name text; v_registration_steps text; v_confirmation_ack text; v_sponsor_html text;
  v_attachment_url text; v_attachment_name text; ct record;
  v_instructor_name text; v_title text; v_title_esc text; v_body_html text;
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
grant execute on function wrap_email_html(text, text) to service_role;
