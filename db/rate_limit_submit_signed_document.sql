-- ============================================================================
-- Rate limit submit_signed_document(), the last public RPC without a cap.
-- create_lead / create_engineering_request / create_contact_message all got
-- per-email + per-IP limits in rate_limit_public_rpcs.sql / rate_limit_by_ip.sql;
-- this one was missed even though it's public (anon-callable from /sign?ref=...)
-- and writes to Storage + the documents table on every call.
--
-- submit_signed_document has no email field on the payload (it's keyed by the
-- lead's ref), so the per-email pattern doesn't apply here. Limited instead by:
--   - IP, via the existing rpc_rate_limit table/current_client_ip() helper
--     (same 15/hr cap as the other trainee-facing RPCs)
--   - ref, since the real abuse case for THIS endpoint is spamming junk
--     documents onto one lead's record rather than rotating identities
--
-- Reuses rpc_rate_limit / current_client_ip() from rate_limit_by_ip.sql — run
-- that migration first if not already applied. Idempotent: safe to re-run.
-- Project: hdvqiiprylrrzrkydtpa.
-- ============================================================================

create or replace function submit_signed_document(p_ref text, p_path text, p_kind text default 'contract')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead uuid;
  v_stage text;
  v_parcours text;
  v_ip text;
  v_recent_ip int;
  v_recent_ref int;
begin
  if p_kind not in ('contract', 'payment_receipt') then
    raise exception 'Invalid document kind.';
  end if;

  v_ip := current_client_ip();
  if v_ip is not null then
    select count(*) into v_recent_ip
    from rpc_rate_limit
    where bucket = 'submit_signed_document' and ip_key = v_ip and created_at > now() - interval '1 hour';
    if v_recent_ip >= 15 then
      raise exception 'Too many requests from this network. Please try again later.';
    end if;
    insert into rpc_rate_limit (bucket, ip_key) values ('submit_signed_document', v_ip);
  end if;

  select id, stage, parcours into v_lead, v_stage, v_parcours from leads where ref = p_ref;
  if v_lead is null then
    raise exception 'Unknown reference.';
  end if;

  select count(*) into v_recent_ref
  from documents
  where lead_id = v_lead and created_at > now() - interval '1 hour';
  if v_recent_ref >= 10 then
    raise exception 'Too many document submissions for this registration. Please try again later.';
  end if;

  insert into documents (lead_id, file_url, sign_channel, signed, verified, kind)
  values (v_lead, p_path, 'manual', true, false, p_kind);

  -- Move the bootcamp lead to "deposit_contract" (caution/contrat reçus,
  -- pending staff verification) the first time the signed contract comes in.
  -- A payment-receipt-only upload doesn't advance the stage on its own —
  -- staff confirm once BOTH documents are present (see verify_and_confirm_step
  -- in the console app). HelpMeSee has no contract/deposit step at all.
  if p_kind = 'contract' and v_parcours = 'bootcamp' and v_stage in ('prerequisites', 'pre_registration') then
    update leads
    set sign_channel = 'manual',
        stage = 'deposit_contract',
        deposit_contract_at = now()
    where id = v_lead;
  end if;

  insert into lead_events (lead_id, type, payload)
  values (v_lead, 'document:uploaded', jsonb_build_object('channel', 'online', 'kind', p_kind));

  return jsonb_build_object('ok', true, 'ref', p_ref, 'kind', p_kind);
end;
$$;

grant execute on function submit_signed_document(text, text, text) to anon, authenticated;
