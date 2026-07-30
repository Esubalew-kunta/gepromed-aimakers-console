-- ============================================================================
-- Fix: public "spots left" counter didn't move when a new trainee registered.
--
-- Root cause: trg_bump_enrolled (schema.sql / trainees_two_parcours.sql) only
-- fired "after update of stage" and only counted a seat once stage became
-- 'confirmed'. create_lead() (the public website's only write path) inserts
-- with the default stage 'lead' and never updates it directly, so a brand
-- new registration never touched trainings.enrolled — it only got counted
-- once a staff member manually confirmed the trainee in the console, which
-- can be days later. Net effect: the public capacity bar looked static right
-- after someone registered.
--
-- Fix: a seat is now held by any lead that hasn't actively dropped out
-- (cancelled_at is null and interest <> 'not_interested'), regardless of
-- stage. Recomputes enrolled from a full count instead of +/-1 nudges, so it
-- can't drift, and fires on INSERT too (not just UPDATE OF stage).
--
-- Run this in the Supabase SQL editor of project aablleekwyjqdxsscyeo.
-- SAFE + IDEMPOTENT — re-runnable.
-- ============================================================================
begin;

create or replace function recompute_enrolled(p_training_id uuid) returns void as $$
begin
  update trainings t
    set enrolled = (
      select count(*) from leads l
      where l.training_id = p_training_id
        and l.cancelled_at is null
        and l.interest <> 'not_interested'
    ),
    status = case
      when (select count(*) from leads l
            where l.training_id = p_training_id
              and l.cancelled_at is null
              and l.interest <> 'not_interested') >= t.capacity
      then 'full' else 'open'
    end
  where t.id = p_training_id;
end;
$$ language plpgsql;

drop trigger if exists trg_bump_enrolled on leads;

create or replace function bump_enrolled() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    perform recompute_enrolled(new.training_id);
  elsif tg_op = 'UPDATE' then
    perform recompute_enrolled(new.training_id);
    if old.training_id is distinct from new.training_id then
      perform recompute_enrolled(old.training_id);
    end if;
  elsif tg_op = 'DELETE' then
    perform recompute_enrolled(old.training_id);
  end if;
  return null;
end;
$$ language plpgsql;

create trigger trg_bump_enrolled
  after insert or delete or update of training_id, stage, cancelled_at, interest
  on leads
  for each row execute function bump_enrolled();

-- Backfill: fix enrolled/status on every training right now so the site
-- reflects reality immediately instead of waiting for the next lead event.
do $$
declare r record;
begin
  for r in select id from trainings loop
    perform recompute_enrolled(r.id);
  end loop;
end;
$$;

commit;

-- Post-check (run separately to eyeball the result):
--   select t.slug, t.capacity, t.enrolled, t.status,
--          (select count(*) from leads l where l.training_id = t.id
--             and l.cancelled_at is null and l.interest <> 'not_interested') as recomputed
--   from trainings t order by t.slug;
