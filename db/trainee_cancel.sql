-- ============================================================================
-- Phase 3 — Trainee cancellation / withdrawal.
-- Adds a dedicated "registered then withdrew" exit, kept distinct from
-- interest = 'not_interested' (a lead who never engaged). A trainee is
-- "cancelled" iff cancelled_at IS NOT NULL.
--
-- Deliberately does NOT model refunds/forfeiture: per Gepromed SOP the €200
-- deposit is handled manually outside the platform, and on cancel it is not
-- refunded to the trainee. This column is a tracking/reporting flag only.
--
-- SAFE + IDEMPOTENT — re-runnable.
-- Run in the Supabase SQL editor or as a migration.
-- ============================================================================
begin;

alter table leads add column if not exists cancelled_at timestamptz;

comment on column leads.cancelled_at is
  'Set when a registered trainee cancels/withdraws (distinct from interest=not_interested). NULL = active. No refund is implied — deposit handling is manual/external per SOP.';

commit;
