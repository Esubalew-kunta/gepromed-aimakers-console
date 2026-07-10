-- ============================================================================
-- Phase 3 — trainee reminder cadence engine.
-- A view the n8n daily sweep queries to know which leads are DUE a reminder,
-- encoding the SOP §Bootcamp cadence:
--   • Caution/contrat relance: every 2 weeks until J-2 months before the event,
--     then every week — while the lead is still in pre_registration and the
--     caution was not waived.
--   • E-learning relance: a few days before the event if e-learning not done.
-- Respects the hard stop (reminders_active + interest <> not_interested) and is
-- idempotent per (lead, template) via the email_log history (last sent_at).
-- Run in the SQL editor of project hdvqiiprylrrzrkydtpa.
-- ============================================================================

create or replace view trainee_due_reminders as
with cand as (
  select
    l.id               as lead_id,
    l.email            as to_email,
    l.parcours,
    l.stage,
    l.caution_waived,
    l.elearning_completed,
    t.start_date,
    (t.start_date - current_date) as days_to_event
  from leads l
  join trainings t on t.id = l.training_id
  where l.reminders_active
    and l.interest <> 'not_interested'
),
last_sent as (
  select lead_id, template, max(sent_at) as sent_at
  from email_log
  group by lead_id, template
)
-- 1) Deposit / contract relance (Bootcamp, still awaiting caution+contract) ----
select
  c.lead_id,
  c.to_email,
  'trainee.bootcamp.relance'::text as template_key,
  c.parcours,
  c.stage,
  c.days_to_event,
  case when c.days_to_event > 60 then 14 else 7 end as interval_days
from cand c
left join last_sent s
  on s.lead_id = c.lead_id and s.template = 'trainee.bootcamp.relance'
where c.parcours = 'bootcamp'
  and c.stage = 'pre_registration'
  and not c.caution_waived
  and coalesce(s.sent_at, timestamptz 'epoch')
      < now() - make_interval(days => case when c.days_to_event > 60 then 14 else 7 end)

union all

-- 2) E-learning relance (Bootcamp, modules not completed, event imminent) ------
select
  c.lead_id,
  c.to_email,
  'trainee.bootcamp.elearning_relance'::text,
  c.parcours,
  c.stage,
  c.days_to_event,
  1 as interval_days
from cand c
left join last_sent s
  on s.lead_id = c.lead_id and s.template = 'trainee.bootcamp.elearning_relance'
where c.parcours = 'bootcamp'
  and c.stage = 'elearning_sent'
  and not c.elearning_completed
  and c.days_to_event between 0 and 5
  and coalesce(s.sent_at, timestamptz 'epoch') < now() - interval '1 day';
