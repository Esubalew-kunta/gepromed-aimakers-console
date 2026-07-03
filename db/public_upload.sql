-- ============================================================================
-- Public "upload signed contract" flow (free tier). The lead uploads their
-- signed contract via a link; it lands on their profile as pending
-- verification for staff to approve. Run in the SQL editor.
--   1. Storage policy: anon may INSERT only into documents/uploads/*.
--   2. submit_signed_document(): records the doc + moves the lead to
--      contract_signed (pending verification). SECURITY DEFINER so anon can
--      call it without any read access to leads.
-- ============================================================================

-- 1. Allow anonymous uploads, scoped to the uploads/ folder of the private
--    documents bucket. Files stay private; staff view them via signed URLs.
drop policy if exists "anon upload signed contracts" on storage.objects;
create policy "anon upload signed contracts"
on storage.objects for insert to anon
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = 'uploads'
);

-- 2. Attach the uploaded file to the lead (by human ref) and mark it pending.
create or replace function submit_signed_document(p_ref text, p_path text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead uuid;
begin
  select id into v_lead from leads where ref = p_ref;
  if v_lead is null then
    raise exception 'Unknown reference.';
  end if;

  insert into documents (lead_id, file_url, sign_channel, signed, verified)
  values (v_lead, p_path, 'manual', true, false);

  -- Move forward to contract_signed (pending verification). Never regress a
  -- lead that is already confirmed.
  update leads
  set sign_channel = 'manual',
      stage = 'contract_signed',
      contract_signed_at = now()
  where id = v_lead and stage in ('lead', 'deposit_paid');

  return jsonb_build_object('ok', true, 'ref', p_ref);
end;
$$;

grant execute on function submit_signed_document(text, text) to anon, authenticated;
