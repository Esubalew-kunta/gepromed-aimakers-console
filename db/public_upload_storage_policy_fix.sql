-- ============================================================================
-- Fix: "Upload failed. Please check the file and try again." on the public
-- /sign?ref=... page.
--
-- Root cause: db/public_upload.sql defines an anon INSERT policy on
-- storage.objects for the documents bucket's uploads/ folder, but that
-- migration was never actually applied to this database — storage.objects
-- has RLS enabled (relrowsecurity=true) with ZERO policies, so every anon
-- upload attempt was rejected outright with "new row violates row-level
-- security policy" (confirmed by a live repro POST against the REST API).
-- The db/trainee_document_upload_v2.sql migration (contract + payment-
-- receipt dual upload) assumed this policy already existed and only touched
-- the documents table + submit_signed_document() RPC — it never created it.
--
-- This migration creates ONLY the missing storage policy. Safe to re-run.
-- Run in the Supabase SQL editor (project aablleekwyjqdxsscyeo).
-- ============================================================================
begin;

drop policy if exists "anon upload signed contracts" on storage.objects;
create policy "anon upload signed contracts"
on storage.objects for insert to anon
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = 'uploads'
);

commit;
