-- ============================================================================
-- Phase 3 — one-call notification RPCs so the n8n workflows stay trivial and
-- robust (no fragile query-param expressions). Each does: template lookup +
-- idempotency + render, and returns {send, to, subject, body, sender} or
-- {send:false}. Project: hdvqiiprylrrzrkydtpa.
-- ============================================================================

-- Router: pass ONLY the lead id. Reads the lead's CURRENT parcours+stage from
-- the DB (the row is already updated when the webhook fires), finds the
-- stage_enter template, gates idempotency (once ever), and renders.
--
-- Phase 10 (2026-07-29): the Supabase DB webhook that calls this has no
-- column filter, so it fires on EVERY `leads` UPDATE, not just stage
-- changes. An eligibility rejection doesn't change `stage` (stays
-- 'prerequisites', only `interest`/`eligibility_checked_at` change), so it
-- never matched a stage_enter template and silently sent nothing. Added a
-- specific branch, keyed on the exact fields verifyEligibility(false) sets
-- (trainees/actions.ts), routing to trainee.bootcamp.eligibility_failed
-- instead of the normal per-stage lookup.
create or replace function notify_for_stage(p_lead uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_parcours text; v_stage text; v_to text; v_key text; v_gate jsonb;
  v_interest text; v_elig_checked timestamptz;
begin
  select parcours, stage, email, interest, eligibility_checked_at
    into v_parcours, v_stage, v_to, v_interest, v_elig_checked
    from leads where id = p_lead;
  if not found then return jsonb_build_object('send', false, 'reason', 'lead missing'); end if;

  if v_parcours = 'bootcamp' and v_stage = 'prerequisites'
     and v_interest = 'not_interested' and v_elig_checked is not null then
    v_key := 'trainee.bootcamp.eligibility_failed';
  else
    select key into v_key from notification_templates
      where pipeline = 'trainee' and variant = v_parcours and stage = v_stage
        and trigger = 'stage_enter' and active = true
      limit 1;
  end if;

  if v_key is null then return jsonb_build_object('send', false, 'reason', 'no template for stage'); end if;
  v_gate := log_email_once(p_lead, v_key, v_to, false);
  if not coalesce((v_gate->>'send')::boolean, false) then
    return jsonb_build_object('send', false, 'reason', 'already sent');
  end if;
  return render_notification(p_lead, v_key);
end; $$;
grant execute on function notify_for_stage(uuid) to service_role;

-- Sweep: pass the lead id + the template_key the view already resolved.
create or replace function notify_reminder(p_lead uuid, p_template_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_to text; v_gate jsonb;
begin
  select email into v_to from leads where id = p_lead;
  if not found then return jsonb_build_object('send', false); end if;
  v_gate := log_email_once(p_lead, p_template_key, v_to, true);
  if not coalesce((v_gate->>'send')::boolean, false) then
    return jsonb_build_object('send', false, 'reason', 'already sent today');
  end if;
  return render_notification(p_lead, p_template_key);
end; $$;
grant execute on function notify_reminder(uuid, text) to service_role;
