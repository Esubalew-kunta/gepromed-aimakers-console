import "server-only";
import { extractFile, type UploadedFile } from "./extract";
import { convertToEUR, FxUnavailableError } from "./fx";
import { buildProcessed } from "./normalize";
import { computeDocKey, collapseSameFileDuplicates, dedupeBatch, markIdempotent, writableExpenses } from "./dedup";
import { loadWorkbook, getTemplateSheet, sanitizeSheetName, readMileageRate } from "./excel";
import type { AnalyzeResult, DepositContext, ProcessedExpense } from "./types";

/**
 * Analysis orchestration. analyzeBatch = read + extract + FX + dedup (returns an
 * editable recap, writes nothing). Committing no longer touches the master: the
 * commit route pushes the reviewed rows to the Google Sheet and records them in
 * the database, which is the source of truth. The master is only an extraction
 * template (validated + read for its mileage rate here).
 */

export interface AnalyzeInput {
  files: UploadedFile[];
  deposit: DepositContext;
  masterBuffer: Buffer;
  runId: string;
  /** Already-committed doc_keys (from the DB) for "already processed" detection. */
  committedKeys: Set<string>;
}

export async function analyzeBatch(input: AnalyzeInput): Promise<AnalyzeResult> {
  const { files, deposit, masterBuffer, runId, committedKeys } = input;

  // The master is an extraction TEMPLATE only: we read it to confirm it's a real
  // Matrice and to pull the per-km mileage rate. Idempotence is sourced from the
  // database (committedKeys), not from any ledger inside the workbook.
  const wb = await loadWorkbook(masterBuffer);
  getTemplateSheet(wb); // throws early if it's not the Matrice file
  const mileageRate = readMileageRate(wb);

  const expenses: ProcessedExpense[] = [];
  const skipped: { file: string; reason: string }[] = [];
  // Batch-wide counter for `id` (React/UI identity) — NOT the same as the
  // per-file `idx` below (which feeds the FILE:hash:index docKey fallback).
  // Two identical files uploaded in one batch share a hash, so keying `id`
  // off the per-file idx alone would collide ("hash-0" both times), causing
  // React key collisions in the review table once one is un-excluded.
  let globalIdx = 0;

  for (const file of files) {
    let fileResult;
    try {
      fileResult = await extractFile(file, deposit);
    } catch (e) {
      skipped.push({ file: file.name, reason: `Lecture impossible : ${(e as Error).message}` });
      continue;
    }
    if (!fileResult.isReceipt || fileResult.receipts.length === 0) {
      skipped.push({ file: file.name, reason: fileResult.reasonIfNot || "Non reconnu comme justificatif." });
      continue;
    }

    let idx = 0;
    for (const r of fileResult.receipts) {
      const id = `${file.hash.slice(0, 10)}-${idx}-${globalIdx++}`;
      let fx = null;
      let fxError: string | null = null;
      if (r.currency && r.currency.toUpperCase() !== "EUR" && r.amountTTC != null && r.issueDate) {
        try {
          fx = await convertToEUR(r.amountTTC, r.currency, r.issueDate);
        } catch (e) {
          if (e instanceof FxUnavailableError) {
            fxError = `Conversion ${r.currency}→EUR impossible au ${r.issueDate} — à vérifier par Nathalie`;
          } else {
            fxError = `Erreur de conversion (${(e as Error).message}) — à vérifier`;
          }
        }
      } else if (r.currency && r.currency.toUpperCase() !== "EUR" && (r.amountTTC == null || !r.issueDate)) {
        fxError = "Conversion impossible : montant ou date manquant — à vérifier";
      }

      const exp = buildProcessed({ extraction: r, deposit, sourceFile: file.name, fileHash: file.hash, fx, fxError, id, mileageRate });
      exp.docKey = computeDocKey(r, file.hash, idx);
      exp.sheetName = sanitizeSheetName(exp.sheetName);
      expenses.push(exp);
      idx++;
    }
  }

  // Collapse the same receipt extracted twice from ONE file (OCR-variant doc
  // numbers) BEFORE docKey dedup, so a single bus ticket isn't written twice.
  collapseSameFileDuplicates(expenses);
  dedupeBatch(expenses);
  markIdempotent(expenses, committedKeys);

  return summarize(runId, deposit.description ? "master.xlsx" : "master.xlsx", expenses, skipped);
}

export function summarize(
  runId: string,
  masterFileName: string,
  expenses: ProcessedExpense[],
  skipped: { file: string; reason: string }[],
): AnalyzeResult {
  const writable = writableExpenses(expenses);
  const groupsMap = new Map<string, { tripLabel: string; traveler: string; period: string; count: number; totalEUR: number }>();
  for (const e of writable) {
    const g = groupsMap.get(e.sheetName) ?? { tripLabel: e.tripLabel, traveler: e.traveler, period: e.period, count: 0, totalEUR: 0 };
    g.count += 1;
    g.totalEUR += e.amountEUR ?? 0;
    groupsMap.set(e.sheetName, g);
  }
  const groups = [...groupsMap.entries()].map(([sheetName, g]) => ({
    sheetName,
    tripLabel: g.tripLabel,
    traveler: g.traveler,
    period: g.period,
    count: g.count,
    totalEUR: Number(g.totalEUR.toFixed(2)),
  }));
  const grandTotalEUR = Number(writable.reduce((s, e) => s + (e.amountEUR ?? 0), 0).toFixed(2));
  const alerts = Array.from(
    new Set(
      expenses.flatMap((e) => (e.duplicateOfId || e.idempotentSkip ? [] : e.alerts)).concat(
        skipped.map((s) => `${s.file} ignoré : ${s.reason}`),
      ),
    ),
  );
  return { runId, masterFileName, expenses, skipped, groups, alerts, grandTotalEUR };
}
