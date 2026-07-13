import "server-only";
import { extractFile, type UploadedFile } from "./extract";
import { convertToEUR, FxUnavailableError } from "./fx";
import { buildProcessed } from "./normalize";
import { computeDocKey, dedupeBatch, markIdempotent, writableExpenses } from "./dedup";
import {
  loadWorkbook,
  getTemplateSheet,
  readLedger,
  writeLedger,
  rebuildManagedSheets,
  rebuildSummary,
  workbookToBuffer,
  sanitizeSheetName,
  resolveSheetName,
  managedSheetNames,
  flattenTables,
  readMileageRate,
  type LedgerEntry,
  type SheetRow,
} from "./excel";
import type { AnalyzeResult, DepositContext, ProcessedExpense } from "./types";

/**
 * End-to-end orchestration. analyzeBatch = read + extract + FX + dedup (returns
 * an editable recap, writes nothing). commitBatch = write the (reviewed)
 * expenses into Nathalie's master workbook and return the saved file.
 */

export interface AnalyzeInput {
  files: UploadedFile[];
  deposit: DepositContext;
  masterBuffer: Buffer;
  runId: string;
}

export async function analyzeBatch(input: AnalyzeInput): Promise<AnalyzeResult> {
  const { files, deposit, masterBuffer, runId } = input;

  const wb = await loadWorkbook(masterBuffer);
  getTemplateSheet(wb); // throws early if it's not the Matrice file
  const ledger = readLedger(wb);
  const ledgerKeys = new Set(ledger.map((e) => e.docKey));
  const mileageRate = readMileageRate(wb);

  const expenses: ProcessedExpense[] = [];
  const skipped: { file: string; reason: string }[] = [];

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
      const id = `${file.hash.slice(0, 10)}-${idx}`;
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

  dedupeBatch(expenses);
  markIdempotent(expenses, ledgerKeys);

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

// ---------------------------------------------------------------------------

function toSheetRow(e: ProcessedExpense): SheetRow {
  return {
    issueDate: e.issueDate,
    purpose: e.purpose,
    vendor: e.vendor,
    location: e.location,
    category: e.category,
    amountEUR: e.amountEUR,
    vatRecoverable: e.vatRecoverable,
    originalCurrency: e.originalCurrency,
    fx: e.fx,
    distanceKm: e.distanceKm,
    etude: e.etude,
  };
}

export interface CommitInput {
  masterBuffer: Buffer;
  expenses: ProcessedExpense[]; // reviewed / edited full list
  employeeName: string;
  runId: string;
}

export interface CommitResult {
  buffer: Buffer;
  written: number;
  grandTotalEUR: number;
  alerts: string[];
}

export async function commitBatch(input: CommitInput): Promise<CommitResult> {
  const { masterBuffer, expenses, employeeName, runId } = input;
  const wb = await loadWorkbook(masterBuffer);
  const template = getTemplateSheet(wb);

  const ledger = readLedger(wb);
  const existingKeys = new Set(ledger.map((e) => e.docKey));

  const toWrite = writableExpenses(expenses).filter((e) => !existingKeys.has(e.docKey));

  // Resolve target sheet names so we NEVER overwrite Nathalie's own sheets, and
  // so all lines of the same trip in this batch land on one sheet.
  const managed = managedSheetNames(ledger);
  const claimed = new Set<string>();
  const resolvedFor = new Map<string, string>(); // desired -> resolved (per batch)
  for (const e of toWrite) {
    const desired = sanitizeSheetName(e.sheetName);
    let resolved = resolvedFor.get(desired.toLowerCase());
    if (!resolved) {
      resolved = resolveSheetName(wb, managed, desired, claimed);
      resolvedFor.set(desired.toLowerCase(), resolved);
      claimed.add(resolved);
    }
    e.sheetName = resolved;
  }

  for (const e of toWrite) {
    const travelerLabel =
      e.traveler && e.traveler !== "Non renseigné — à préciser" ? e.traveler : "Non renseigné — à préciser";
    const entry: LedgerEntry = {
      docKey: e.docKey,
      fileHash: e.fileHash,
      runId,
      validated: true, // committed after Nathalie's review => locked
      sheetName: e.sheetName,
      tripLabel: e.tripLabel,
      traveler: e.traveler,
      travelerLabel,
      period: e.period,
      lieu: e.location || "—",
      row: toSheetRow(e),
    };
    ledger.push(entry);
  }

  rebuildManagedSheets(wb, template, ledger);
  const alerts = Array.from(new Set(expenses.flatMap((e) => (e.duplicateOfId || e.idempotentSkip ? [] : e.alerts))));
  rebuildSummary(wb, ledger, employeeName, alerts);
  writeLedger(wb, ledger);

  // Convert all structured Table references to plain A1 and drop the tables so
  // real Excel opens the file with no "repair" (ExcelJS mangles table XML).
  flattenTables(wb);

  const buffer = await workbookToBuffer(wb);
  const grandTotalEUR = Number(ledger.reduce((s, e) => s + (e.row.amountEUR ?? 0), 0).toFixed(2));
  return { buffer, written: toWrite.length, grandTotalEUR, alerts };
}
