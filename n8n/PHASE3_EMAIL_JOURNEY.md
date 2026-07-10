# Phase 3 — Trainee email journey (n8n build/handoff spec)

**DB side is DONE & tested** (project `hdvqiiprylrrzrkydtpa`):
- `notification_templates` — 13 rows; **11 active with verbatim bodies + `{{merge_fields}}`**, 2 inactive gaps.
- `trainee_due_reminders` view — the SOP reminder cadence (tested, see below).

**This file** = what to build in **n8n** (no n8n instance was reachable from the build session, so this is a handoff). Reuse the existing pattern in `n8n/01-new-lead-welcome.json` … `04-engagement-contract.json` (Supabase Header Auth + Gmail + idempotency) — just make it **template-table driven**.

---

## Credentials to create in n8n
- **Supabase Header Auth** — header `apikey` = the `service_role` key of `hdvqiiprylrrzrkydtpa`.
- **Gmail/SMTP × 2 identities** — `hms@gepromed.com` and `education@gepromed.com` (each template row carries its `sender`).

## Workflow 1 — Stage-change router (transactional emails)
Trigger: **Supabase Database Webhook** on `leads` UPDATE (or poll `lead_events` for `type like 'stage:%'`) → n8n Webhook.
1. On stage change, read the lead + its training (join) via Supabase REST.
2. Look up the template: `select * from notification_templates where pipeline='trainee' and variant=<lead.parcours> and stage=<new stage> and trigger='stage_enter' and active=true`.
3. If none (or inactive) → stop.
4. **Render** `subject` + `body`: replace `{{merge_fields}}` (contract below).
5. **Idempotency gate**: skip if `(lead, template)` already in `email_log` (one-shot) → else send.
6. Send via the template's `sender` (Gmail node), attach the logical `attachments[]` (map keys → files, see below).
7. Insert into `email_log(lead_id, template, to_email, status='sent')`.

Stage→template routing is already encoded in the table (`variant, stage, trigger`). Summary:
- **HelpMeSee:** lead→`enrollment_request` · dates_validation→`date_proposals` · invoice→`confirmation` · elearning_check→`practical_info` · simulator_access→`credentials`*(inactive)* · done→`satisfaction`.
- **Bootcamp:** pre_registration→`registration` · deposit_contract→`confirmation` · practical_info→`practical_info` · elearning_sent→`elearning` · done→`end_survey`.

## Workflow 2 — Daily reminder sweep (relance cadence)
Trigger: **Schedule** (e.g. daily 09:00).
1. `select * from trainee_due_reminders` (already applies the SOP cadence + hard-stops).
2. For each row: load its template by `template_key`, render, send from the template's `sender`, insert `email_log`.
   - `trainee.bootcamp.relance` is **inactive** (client to write) — the sweep returns the due leads; skip send until the template is active.
   - `trainee.bootcamp.elearning_relance` is active.

`trainee_due_reminders` logic (tested 10/10 scenarios): deposit/contract relance every **14 days** while event >60d away, **7 days** once ≤60d, while `pre_registration` and not `caution_waived`; e-learning relance when event within 5 days and `elearning_completed=false`; both respect `reminders_active` + `interest<>not_interested` and are spaced by `email_log`.

## Merge-field contract (render these)
| Field | Source |
|---|---|
| `{{first_name}}` `{{last_name}}` | `leads.first_name/last_name` |
| `{{title}}` | `trainings.title.fr` (or `.en`) |
| `{{dates}}` | format `trainings.start_date`–`end_date` |
| `{{duration_days}}` | `trainings.duration_days` |
| `{{tarif}}` | `trainings.price_eur` |
| `{{deposit_link}}` | **client to provide** (Stripe/pay link) |
| `{{elearning_link}}` | `https://gepromed.sinfony.eu/` |
| `{{survey_link}}` | **client to provide** |
| `{{instructor_name}}` `{{instructor_phone}}` | per-session (from course/staff) |
| `{{date_options}}` | staff-entered (HMS date proposals) |
| `{{sponsor_or_tariff}}` | if `trainings.is_sponsored` → sponsor logo(s)/names (`trainings.sponsors`), else `Tarif participant : {{tarif}} €` |

## Attachments (map logical keys → files — client to provide)
`enrollment_form` (HMS), `engagement_contract` + `deposit_link` (bootcamp), `invoice` (HMS), `practical_info`, `program`, `map`, `survey`, `certificate`.

## Still needed from the client (see project register)
1. The **2 inactive templates**: `trainee.bootcamp.relance`, `trainee.hms.credentials`.
2. **Mailbox access** for `hms@` + `education@` in n8n.
3. **Links/files**: deposit pay link, survey link, certificate, the attachment files above.
4. **Build/import** these 2 workflows in n8n + set the Supabase Database Webhook.
