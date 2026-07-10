-- ============================================================================
-- Phase 3 n8n helpers: log_email_once (idempotency) + render_notification
-- (server-side merge-field rendering, so the n8n workflows stay simple and the
-- rendering is testable in SQL). Project: hdvqiiprylrrzrkydtpa.
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

-- 2. Render a template for a lead: fills the DB-derivable merge fields and
-- returns {send, to, subject, body, sender}. Client-provided links (deposit,
-- survey, instructor...) are left as literal {{...}} until supplied.
create or replace function render_notification(p_lead uuid, p_template_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare tpl record; l record; t record; subj text; bod text; block text; dates text;
begin
  select * into tpl from notification_templates where key = p_template_key and active limit 1;
  if not found then return jsonb_build_object('send', false, 'reason', 'template inactive/missing'); end if;
  select * into l from leads where id = p_lead;
  if not found then return jsonb_build_object('send', false, 'reason', 'lead missing'); end if;
  select * into t from trainings where id = l.training_id;

  dates := coalesce(to_char(t.start_date, 'DD/MM/YYYY'), '')
    || case when t.end_date is not null and t.end_date <> t.start_date
            then ' - ' || to_char(t.end_date, 'DD/MM/YYYY') else '' end;

  if coalesce(t.is_sponsored, false) then
    block := 'Sponsorisé : ' || coalesce(
      (select string_agg(s->>'name', ', ') from jsonb_array_elements(coalesce(t.sponsors,'[]'::jsonb)) s), 'labo(s)');
  else
    block := 'Tarif participant : ' || coalesce(t.price_eur::text, '') || ' €';
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
  bod := replace(bod, '{{elearning_link}}', 'https://gepromed.sinfony.eu/');

  return jsonb_build_object('send', true, 'to', l.email, 'subject', subj, 'body', bod, 'sender', tpl.sender);
end; $$;
grant execute on function render_notification(uuid, text) to service_role;
