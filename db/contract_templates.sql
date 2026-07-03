-- ============================================================================
-- Contract templates: a platform-managed library of blank engagement
-- contracts. Staff pick one per lead (auto-selected when the lead is marked
-- deposit-paid): the course's own template if set, else the global default.
-- Run in the SQL editor of project aablleekwyjqdxsscyeo.
-- ============================================================================

create table if not exists contract_templates (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  file_url   text,                       -- path in the public 'contracts' bucket
  is_default boolean not null default false,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- per-course override (optional) + which template is attached to a lead
alter table trainings add column if not exists contract_template_id uuid
  references contract_templates(id) on delete set null;
alter table leads add column if not exists contract_template_id uuid
  references contract_templates(id) on delete set null;

-- public bucket so the lead can download the contract from an emailed link
insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', true)
on conflict (id) do nothing;

-- Auto-attach the right template when a lead becomes deposit_paid:
-- course template first, else the active default.
create or replace function auto_attach_contract() returns trigger
language plpgsql as $$
begin
  if new.stage = 'deposit_paid'
     and old.stage is distinct from 'deposit_paid'
     and new.contract_template_id is null then
    new.contract_template_id := coalesce(
      (select contract_template_id from trainings where id = new.training_id),
      (select id from contract_templates where is_default and active order by created_at limit 1)
    );
  end if;
  return new;
end; $$;

drop trigger if exists trg_auto_contract on leads;
create trigger trg_auto_contract
  before update on leads
  for each row execute function auto_attach_contract();

-- Staff-only (SaaS uses the service_role key, which bypasses RLS anyway).
alter table contract_templates enable row level security;
drop policy if exists contract_templates_staff on contract_templates;
create policy contract_templates_staff on contract_templates
  for all to authenticated using (true) with check (true);
