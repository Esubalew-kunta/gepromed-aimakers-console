-- ============================================================================
-- Phase 3 n8n helpers: log_email_once (idempotency) + render_notification
-- (server-side merge-field rendering, so the n8n workflows stay simple and the
-- rendering is testable in SQL). Project: hdvqiiprylrrzrkydtpa.
--
-- Kept in sync with what's actually deployed (this file previously drifted
-- from prod — the sponsor-conditional {{registration_steps}}/
-- {{confirmation_ack}} wording and the sponsor logo/name badge below were
-- applied directly against Supabase and only backfilled into this file
-- afterward). If you change these functions, apply them live AND update this
-- file in the same change so it doesn't drift again.
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
-- returns {send, to, subject, body, body_html, sender}. body stays plain text
-- (what staff edited); body_html is the branded version n8n actually sends.
-- Client-provided links (deposit, survey, instructor...) are left as literal
-- {{...}} until supplied.
--
-- Sponsored vs self-funded trainings get genuinely different content, not
-- just a cosmetic label swap:
--   - {{registration_steps}} / {{confirmation_ack}}: sponsored trainees are
--     told their seat is fully funded, no deposit/contract required, seat
--     confirmed directly. Self-funded trainees get the original deposit +
--     contract ask. (Previously the DB trigger + email both asked every
--     trainee for the €200 deposit and signed contract regardless of
--     sponsorship — this is the fix for that.)
--   - v_sponsor_html: a visual logo+name badge (or an initials chip when no
--     logo is set) shown under the email header for sponsored trainings,
--     instead of only a plain-text sponsor mention.
create or replace function render_notification(p_lead uuid, p_template_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare tpl record; l record; t record; subj text; bod text; block text; dates text;
  v_sponsor_name text; v_registration_steps text; v_confirmation_ack text; v_sponsor_html text;
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
    block := 'Tarif participant : ' || coalesce(t.price_eur::text, '') || ' €';
    v_registration_steps :=
      '- Signing the training commitment agreement (attached).' || E'\n' ||
      '- Paying a €200 deposit via the online link below: {{deposit_link}}' || E'\n\n' ||
      'This deposit is fully refundable at the end of the training. It was introduced to help minimize last-minute cancellations and ensure smooth logistics for all participants.';
    v_confirmation_ack :=
      'I acknowledge receipt of your signed contract as well as the deposit payment for the ' ||
      coalesce(t.title->>'en', t.title->>'fr', '') || ', which will take place at Gepromed on ' || dates || '.';
    v_sponsor_html := null;
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

  return jsonb_build_object('send', true, 'to', l.email, 'subject', subj, 'body', bod, 'body_html', wrap_email_html(bod, v_sponsor_html), 'sender', tpl.sender);
end; $$;
grant execute on function render_notification(uuid, text) to service_role;
grant execute on function wrap_email_html(text, text) to service_role;
