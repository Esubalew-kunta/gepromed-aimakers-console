-- ============================================================================
-- Phase 8 — automation helpers for n8n. Run in the SQL editor of
-- project aablleekwyjqdxsscyeo.
--   1. log_email_once()  — DB-enforced idempotency (never double-send).
--   2. leads_due_reminders — the daily reminder sweep query (respects the
--      hard-stop: reminders_active + interest <> not_interested).
-- ============================================================================

-- ---- 1. Idempotent email logging ----
-- Returns TRUE if this (lead, template) has NOT been sent yet (→ n8n should
-- send, and the row is recorded now). Returns FALSE if already sent (→ skip).
-- p_daily=true limits to once per calendar day (for recurring reminders);
-- otherwise once ever (for one-shot templates like welcome / confirmation).
-- Returns {"send": true}  when this is the first send  → n8n proceeds to email.
-- Returns {"send": false} when already sent            → n8n skips.
-- A JSON object (not a bare boolean) so the n8n IF node reads {{$json.send}}.
create or replace function log_email_once(
  p_lead uuid,
  p_template text,
  p_to text,
  p_daily boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
begin
  if p_daily then
    select exists(
      select 1 from email_log
      where lead_id = p_lead and template = p_template
        and (sent_at at time zone 'Europe/Paris')::date
            = (now() at time zone 'Europe/Paris')::date
    ) into v_exists;
  else
    select exists(
      select 1 from email_log where lead_id = p_lead and template = p_template
    ) into v_exists;
  end if;

  if v_exists then
    return jsonb_build_object('send', false);
  end if;

  insert into email_log (lead_id, template, to_email, status)
  values (p_lead, p_template, p_to, 'sent');
  return jsonb_build_object('send', true, 'to', p_to, 'template', p_template);
end;
$$;

grant execute on function log_email_once(uuid, text, text, boolean) to service_role;

-- ---- 2. Daily reminder sweep source ----
-- Leads still in the pipeline that should receive a reminder today.
-- Excludes confirmed leads and honors the hard-stop.
create or replace view leads_due_reminders as
select
  l.id,
  l.ref,
  l.first_name,
  l.last_name,
  l.email,
  l.stage,
  l.training_title_snapshot,
  t.title ->> 'fr' as session_fr,
  t.title ->> 'en' as session_en,
  t.deposit_eur,
  t.start_date
from leads l
left join trainings t on t.id = l.training_id
where l.stage in ('lead', 'deposit_paid', 'contract_signed')
  and l.reminders_active = true
  and l.interest <> 'not_interested'
  and l.confirmed_at is null;

-- View inherits access from base tables; the SaaS/n8n read it with the
-- service_role key (bypasses RLS). Not exposed to anon.
