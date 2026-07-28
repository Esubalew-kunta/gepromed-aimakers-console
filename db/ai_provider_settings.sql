-- ============================================================================
-- AI provider keys for expense extraction, editable from the Expenses page
-- (admin-only) instead of only via .env. Single row, id='default'. A blank
-- field falls back to the corresponding env var. SAFE + IDEMPOTENT.
-- ============================================================================

begin;

create table if not exists ai_provider_settings (
  id                text primary key default 'default',
  anthropic_api_key text,
  anthropic_model   text,
  openai_api_key    text,
  openai_model      text,
  updated_at        timestamptz not null default now(),
  updated_by        text
);

-- Staff-only (console via service_role bypasses RLS entirely; this policy
-- covers any direct authenticated access). The API route additionally
-- restricts reads/writes to the admin role.
alter table ai_provider_settings enable row level security;
drop policy if exists ai_provider_settings_staff_all on ai_provider_settings;
create policy ai_provider_settings_staff_all on ai_provider_settings for all to authenticated using (true) with check (true);

commit;
