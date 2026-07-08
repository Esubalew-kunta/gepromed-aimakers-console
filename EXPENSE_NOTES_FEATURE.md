# Notes de frais — Expense Notes feature

Real, working replacement for the demo Finance tab. Reads Nathalie's travel
receipts with Claude, converts currency at the **official rate on the receipt's
issue date**, categorizes, and **appends** everything into **her existing master
Excel file** (one sheet per trip) — she reviews an editable recap and validates.

Built per `Gepromed_PRD_Expense-Notes_for-Kunta.md`, the Notion SOP, and the
weekly-meeting decisions (single master file; human-in-the-loop for OCR).

## How it works

1. **Upload** the master `Matrice LM_0226_rembt Frais.xlsx` (or reuse the last
   one saved in Supabase) + the batch of receipts (PDF/photos) + a short deposit
   description (traveler + purpose).
2. **Analyze** (`POST /api/expenses/analyze`): Claude **Opus 4.8** vision reads
   each file (multilingual, splits multi-receipt files) → structured JSON with
   per-field confidence; foreign currency is converted to EUR at the **issue
   date** (ECB/Frankfurter, CurrencyBeacon fallback for AED & non-ECB);
   duplicates are merged; already-processed receipts are skipped.
3. **Review**: an editable table shows every line with confidence flags and
   alerts. Nathalie corrects anything (category, amount, sheet, traveler…).
   Nothing is guessed — missing/uncertain fields are left blank and flagged.
4. **Commit** (`POST /api/expenses/commit`): the reviewed lines are written into
   the master workbook (a new sheet per trip, cloned from `Matrice`, with the
   `=SUM`/`SUBTOTAL` formulas, the original amount + FX rate + source as a cell
   comment), the `Synthèse` sheet is rebuilt, and the file downloads. Her own
   pre-existing sheets are never touched.

**Never overwrites her data**; **idempotent** (re-running adds nothing);
committed rows are **locked** via a hidden `_Ledger` sheet.

## Code map (`src/lib/expenses/`)

| File | Role |
|------|------|
| `types.ts` | Types + Zod schema + category→column map + Matrice geometry |
| `extract.ts` | Claude Opus vision extraction (PDF/image → validated JSON) |
| `fx.ts` | Issue-date FX: ECB/Frankfurter + CurrencyBeacon fallback, cached |
| `normalize.ts` | Trip/period/traveler routing + review-flag rules |
| `dedup.ts` | Doc-key dedup, booking+receipt merge, idempotence |
| `excel.ts` | ExcelJS engine: clone Matrice, formulas, comments, `Synthèse`, `_Ledger` |
| `orchestrator.ts` | `analyzeBatch` / `commitBatch` |
| `storage.ts` | Best-effort Supabase persistence (master, receipts, audit, FX cache) |

Routes: `src/app/api/expenses/{analyze,commit,master}/route.ts`.
UI: `src/components/ExpenseRunner.tsx` (upload → editable review → download).

## Verified against the 11 real receipts (PRD §13)

Full pipeline run on the client's actual receipts:

- Air France **1081.99 €** (duplicata, fare+insurance, VAT-exempt → all flagged)
- Lufthansa booking + real ticket → **one line 315.80 €** (dedup)
- Trip.com **1083.34 €**; Trenitalia **9 €**; ATVO **12 €**
- CTS: **2 tickets → 2 lines**, VAT 0.19 each
- Tampa **8852 DKK → 1185.19 €** (ECB 2026-02-03, rate 7.4688)
- Hotel booking + payment receipt → **one line, 69367 JPY → 378.05 €** (paid amount)
- EFFIA parking **91 €**, VAT 15.17
- Flights VAT = blank (exempt, not invented); missing traveler/date → flagged
- Idempotence: re-run wrote **0** new rows
- All of Nathalie's existing sheets + the `Dépenses` table preserved

## Deploy / config

Env (see `.env.local`, gitignored):
```
ANTHROPIC_API_KEY=...            # Claude Opus 4.8 vision
ANTHROPIC_MODEL=claude-opus-4-8
FX_FALLBACK_PROVIDER=currencybeacon
FX_FALLBACK_API_KEY=...          # CurrencyBeacon (AED & non-ECB)
```

**Run once on Supabase** (optional but recommended — enables master persistence,
audit, FX cache): `db/expenses.sql` (creates `expense_runs`, `expense_receipts`,
`fx_rate_cache`, and the private `expense-files` bucket). Without it the feature
still works fully (upload the master each run; idempotence lives in the file).

Frankfurter/ECB needs no key. The `/api/programs` and `/api/expenses/*` routes
run on the Node runtime; `/api/expenses/*` stays behind the console login.
