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
create or replace function wrap_email_html(p_body text, p_sponsor_html text default null)
returns text language sql immutable as $$
  select
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">' ||
    '<tr><td align="center">' ||
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #eceef2;border-radius:12px;overflow:hidden;">' ||
    '<tr><td style="background:#1a4fb8;padding:20px 28px;">' ||
    '<span style="color:#ffffff;font-size:20px;font-weight:bold;">Gepromed</span>' ||
    '<span style="color:#bcdcff;font-size:12px;">&nbsp;&nbsp;Formation chirurgicale</span>' ||
    '</td></tr>' ||
    coalesce(p_sponsor_html, '') ||
    '<tr><td style="padding:28px;color:#1f2430;font-size:15px;line-height:1.6;">' ||
    (
      select string_agg(
        '<p style="margin:0 0 14px;">' ||
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
    '<tr><td style="padding:16px 28px;background:#f9fafb;border-top:1px solid #eceef2;color:#9aa2b1;font-size:11px;">' ||
    'Gepromed &middot; 4 rue Kirschleger, 67000 Strasbourg' ||
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
create or replace function render_notification(p_lead uuid, p_template_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare tpl record; l record; t record; subj text; bod text; block text; dates text;
  v_sponsor_name text; v_registration_steps text; v_confirmation_ack text; v_sponsor_html text;
  v_attachment_url text; v_attachment_name text; ct record;
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

  return jsonb_build_object(
    'send', true, 'to', l.email, 'subject', subj, 'body', bod,
    'body_html', wrap_email_html(bod, v_sponsor_html), 'sender', tpl.sender,
    'attachment_url', v_attachment_url, 'attachment_name', v_attachment_name
  );
end; $$;
grant execute on function render_notification(uuid, text) to service_role;
grant execute on function wrap_email_html(text, text) to service_role;
