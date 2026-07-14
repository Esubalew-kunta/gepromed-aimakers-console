# Phase 8 — n8n automation: precise setup guide

You've imported the 3 workflows. This guide gets them **fully working**, step by
step, with a check after each part. Follow it top to bottom.

**Values you'll paste (keep this handy):**
- **Supabase URL:** `https://aablleekwyjqdxsscyeo.supabase.co`
- **Secret key:** your `sb_secret_…` value — it's `SUPABASE_SERVICE_ROLE_KEY` in the SaaS `.env.local`. (Never paste this into a node text field; it only goes into the credential in Part 1.)
- Webhook paths already in the workflows: `gepromed-new-lead` and `gepromed-lead-updated`.

---

## PART 0 — Run the SQL (once) ✅ already done
`db/phase8_email.sql` is applied (`log_email_once` + `leads_due_reminders` verified). If you ever reset the DB, re-run it.

---

## PART 1 — Create the ONE Supabase credential in n8n
1. n8n left sidebar → **Credentials** → **Add credential**.
2. Search and pick **"Header Auth"** (exact type: *Header Auth*).
3. Fill:
   - **Name:** `Supabase apikey`
   - **Name** (the header name): `apikey`
   - **Value:** paste your `sb_secret_…` key.
4. **Save.**

✅ **Check:** the credential list now shows **Supabase apikey**.

(Your Gmail credential already exists — you'll pick it in Part 2.)

---

## PART 2 — Configure each workflow's nodes

Do this for **all three** workflows. Open a workflow (Workflows → click it), then open each node and set the credential.

### 2a. HTTP Request nodes → Supabase credential
In every workflow, each **HTTP Request** node (named "Idempotency gate…", "Get leads due reminders…", "One reminder per day…"):
1. Open the node.
2. Field **Authentication** = `Generic Credential Type`.
3. Field **Generic Auth Type** = `Header Auth`.
4. **Credential for Header Auth** = select **Supabase apikey**.
5. Leave URL / body as-is. **Save** (top-right of the node, or just close).

✅ **Check:** open one HTTP node → click **"Execute step"** (play icon on the node). It should return `{"send":true}` or a JSON array (leads), **not** a 401/`"No API key"` error. If 401 → the credential header name must be exactly `apikey` (lowercase).

### 2b. Email nodes → your Gmail account
In each workflow, the send node ("Send deposit-request email" / "Send reminder email" / "Send confirmation + LMS credentials"):
1. Open the node. Confirm **Resource = Message**, **Operation = Send** (set them if blank).
2. **Credential to connect with** = select **your Gmail account**.
3. Confirm **Email Type = HTML** and the **Message** field contains the HTML (it does after import).
4. **Save.**

> **If you use SMTP, not Gmail:** delete the Gmail node, drag in a **"Send Email"** node, then copy these three fields from this doc's workflow into it — **To** = `{{ … .email }}`, **Subject**, **HTML** — and re-connect the wire from the `IF` "true" output into it. Pick your SMTP credential.

### 2c. Reminder workflow timezone
Open **`Gepromed · Daily reminder sweep`** → top-right **⋮ → Settings** → **Timezone** = `Europe/Paris` → **Save**.

✅ **Check:** every node in all three workflows shows a green credential (no red "Credential missing" badge).

---

## PART 3 — Activate + copy the two webhook URLs
1. Open **`Gepromed · New-lead welcome…`** → toggle **Active** (top-right) to ON.
2. Open its **"Supabase · new lead"** (Webhook) node → copy the **Production URL**. It looks like:
   `https://<your-n8n-host>/webhook/gepromed-new-lead` → call this **URL_A**.
3. Open **`Gepromed · Confirm + LMS handoff`** → toggle **Active** ON.
4. Open its **"Supabase · lead updated"** node → copy the **Production URL**:
   `https://<your-n8n-host>/webhook/gepromed-lead-updated` → call this **URL_B**.
5. Open **`Gepromed · Daily reminder sweep`** → toggle **Active** ON (no URL — it's scheduled).

> Use the **Production URL**, not the Test URL. The Test URL only works while you're clicking "Listen for test event".

✅ **Check:** all three workflows show **Active**. You have URL_A and URL_B copied.

---

## PART 4 — Point Supabase at n8n (Database Webhooks)
Supabase dashboard (project **`aablleekwyjqdxsscyeo`**) → **Database** (left) → **Webhooks** → **Create a new hook**.

**Hook 1 — new lead → welcome email**
- **Name:** `gepromed-new-lead`
- **Table:** `leads`  ·  **Schema:** `public`
- **Events:** tick **Insert** only
- **Type of webhook:** `HTTP Request`
- **Method:** `POST`
- **URL:** paste **URL_A**
- **HTTP Headers:** leave the default `Content-Type: application/json`
- **Create webhook.**

**Hook 2 — lead updated → confirm/LMS email**
- **Name:** `gepromed-lead-updated`
- **Table:** `leads`  ·  **Schema:** `public`
- **Events:** tick **Update** only
- **Method:** `POST`  ·  **URL:** paste **URL_B**
- **Create webhook.**

**Hook 3 — lead updated → engagement contract email** (workflow `04`)
- **Name:** `gepromed-lead-deposit`
- **Table:** `leads`  ·  **Schema:** `public`
- **Events:** tick **Update** only
- **Method:** `POST`  ·  **URL:** paste **URL_C** (the Production URL of `04-engagement-contract`, path `/webhook/gepromed-lead-deposit`)
- **Create webhook.**

> Two Update hooks on `leads` is fine: each workflow's IF ignores updates that are not its transition (confirmed vs deposit_paid).
> **Prerequisite:** upload at least one contract template and set it **default** (SaaS → Contract templates), so there is a contract to attach and send.

✅ **Check:** the Webhooks list shows all three, **Enabled**.

> The reminder sweep needs **no** webhook — it runs on the schedule.

---

## PART 5 — Test the whole loop
1. **Welcome email** — open the public website (`:3001`) → **/register** → submit a real registration with an email you can check.
   - ✅ Within ~10s: that inbox gets the **deposit-request** email.
   - ✅ In n8n → the New-lead workflow → **Executions** shows a green run.
   - ✅ In Supabase → `select * from email_log order by sent_at desc limit 3;` a `welcome` row.
2. **Confirm + LMS** — in the SaaS console (`:3000`) → **Lead management** → open that lead → advance to **Confirmé**.
   - ✅ The inbox gets the **confirmation + LMS credentials** email.
3. **Reminders (idempotency)** — open the reminder workflow → **Execute Workflow** (manual run).
   - ✅ In-pipeline leads get one reminder. Run it **again** → **no second email** (the idempotency gate returns `send:false`).

---

## Troubleshooting (quick)
| Symptom | Fix |
|---|---|
| HTTP node returns `401` / "No API key found" | Credential header name must be exactly **`apikey`** (lowercase); value = the `sb_secret_…` key. |
| Email node red / won't send | Gmail node: set **Resource=Message, Operation=Send**, pick your Gmail credential, Email Type=HTML. Or swap to a **Send Email** (SMTP) node. |
| Webhook workflow never runs | You used the **Test URL**. Copy the **Production URL** into the Supabase webhook, and make sure the workflow is **Active**. |
| Confirm email fires on every edit | The **"Just confirmed?"** IF must be intact (record.stage = `confirmed` AND old_record.stage ≠ `confirmed`). Re-check its two conditions. |
| Reminder sends twice | Ensure the wire is **IF → true → email** (the `false` output goes nowhere), and the HTTP body has `"p_daily": true`. |
| Fields render as `[object Object]` / blank | The lead fields come from `$json.body.record.*` (webhook flows) or `$json.*` (reminder flow). Don't change those expressions. |
| IF "First send only?" always false | The gate reads `{{ $json.send }}` from the previous HTTP node's JSON. Confirm the HTTP node ran and returned `{"send":true}`. |

---

## What's live after this
Register on the site → automated deposit email · daily reminders (idempotent, hard-stop respected) · confirm → LMS credentials email · every send logged in `email_log`.

## Deferred (say the word to add)
Engagement-doc email with the 2 signing buttons (on `deposit_paid`) · Documenso online signing + its webhook · pre-course welcome (schedule) · error-alert workflow · public upload page.

---

## PART E — Engineering "Send via n8n" (workflow `12-engineering-stage-email.json`)

Powers the **Send via n8n** button in the console's Engineering request drawer. Unlike the
trainee emails (which look up + render a DB template), the console already renders the
staff-**edited** subject/body, so this workflow just relays it to Gmail.

1. **Import** `n8n/12-engineering-stage-email.json`.
2. Open the **"Send engineering email"** (Gmail) node → set its credential. **Sender = the same
   Google account as the expense Sheet export: `amraoui.cabinet.test@gmail.com`.**
   ⚠️ The Sheet export uses a **Google *Sheets* OAuth2** credential — a Gmail node **cannot** use
   it (different credential type + no `gmail.send` scope). So add a **Gmail OAuth2** credential
   authorized as *that same* `amraoui.cabinet.test@gmail.com` account (one-time Google sign-in)
   and select it here. Emails then send **from the same mailbox that owns the sheet**.
3. **Activate** the workflow, then copy its **Production** webhook URL
   (`https://<your-n8n>/webhook/send-eng-email`).
4. Set it as **`ENG_EMAIL_WEBHOOK_URL`** in the console's `.env.local` (and on Render for prod).
   Until this is set, the Send button stays inert and shows "n8n send not configured" — Copy /
   open-in-mail still work.
5. *(Optional, recommended)* add **Header Auth** on the Webhook node checking `x-webhook-secret`
   against your `N8N_WEBHOOK_SECRET` so only the console can call it.

**Payload the console POSTs:** `{ requestId, ref, to, subject, body }` → the Gmail node maps
`to`/`subject`/`body` from `$json.body`. On success the console logs a "📧 Email sent to …"
audit comment on the request.

✅ **Check:** open an engineering request at an emailing stage → edit if needed → **Send via
n8n** → the requester receives it and the drawer shows "Sent ✓".
