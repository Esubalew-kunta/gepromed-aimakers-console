-- ============================================================================
-- Notes de frais (expense notes) feature — persistence + audit.
-- Run in the Supabase SQL editor. Safe to re-run (IF NOT EXISTS / on conflict).
--
-- The authoritative idempotence ledger lives INSIDE Nathalie's master .xlsx
-- (hidden "_Ledger" sheet). These tables are a server-side AUDIT MIRROR +
-- master-file persistence so she doesn't re-upload every run, and an FX cache
-- so identical (date,currency) lookups are reproducible and rate-limit-safe.
-- ============================================================================

-- One row per analyze/commit run.
create table if not exists expense_runs (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  created_by      text,                              -- user email
  master_file     text,                              -- original workbook filename
  master_path     text,                              -- storage path of the saved workbook
  status          text not null default 'analyzed',  -- analyzed | committed | validated
  grand_total_eur numeric,
  summary         jsonb,                             -- per-sheet group summary
  alerts          jsonb                              -- run-level alerts
);

-- One row per processed expense line (audit trail; validated flag = locked).
create table if not exists expense_receipts (
  id             uuid primary key default gen_random_uuid(),
  run_id         uuid references expense_runs(id) on delete cascade,
  created_at     timestamptz not null default now(),
  doc_key        text,                    -- dedup key (doc number / file hash)
  file_hash      text,
  source_file    text,
  storage_path   text,                    -- receipt file in storage (traceability)
  sheet_name     text,
  trip_label     text,
  traveler       text,
  period         text,
  issue_date     date,
  category       text,
  original_amount   numeric,
  original_currency text,
  amount_eur     numeric,
  vat_recoverable numeric,
  fx             jsonb,                   -- {rate, rateDate, source, ...}
  needs_review   boolean not null default false,
  duplicate_of   text,
  alerts         jsonb,
  validated      boolean not null default false
);

create index if not exists expense_receipts_run_idx on expense_receipts(run_id);
create index if not exists expense_receipts_dockey_idx on expense_receipts(doc_key);

-- FX cache: official rate per (date, currency, source) so we never refetch and
-- stay reproducible for a fiscal audit. Rate = units of `currency` per 1 EUR.
create table if not exists fx_rate_cache (
  rate_date   date not null,
  currency    text not null,
  source      text not null,
  rate        numeric not null,
  quote_date  date,                       -- actual quote date (weekend fallback)
  created_at  timestamptz not null default now(),
  primary key (rate_date, currency, source)
);

-- Private bucket for receipts + the persisted master workbook. Not public:
-- files are served to the app via the service_role key only.
insert into storage.buckets (id, name, public)
values ('expense-files', 'expense-files', false)
on conflict (id) do nothing;
