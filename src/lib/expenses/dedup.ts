import "server-only";
import type { ProcessedExpense, ReceiptExtraction } from "./types";

/**
 * Deduplication, booking+receipt merge, and idempotence.
 *
 * - docKey = normalized document number when present (dedup across files, e.g.
 *   the Lufthansa ticket in 2 files, the Booking reservation in 2 files);
 *   otherwise a file-hash + index key (so re-uploading the same file is caught).
 * - Within a batch, same docKey => one primary line; the rest become duplicates
 *   (excluded from totals + not written). A booking + its payment receipt for
 *   the same event collapse into one line whose amount is the actually-paid one.
 * - Idempotence: a docKey already in the workbook _Ledger is skipped, so
 *   re-running a batch adds nothing.
 */

export function computeDocKey(r: ReceiptExtraction, fileHash: string, index: number): string {
  if (r.docNumber && r.docNumber.trim()) {
    const norm = r.docNumber.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (norm.length >= 4) return `DOC:${norm}`;
  }
  return `FILE:${fileHash}:${index}`;
}

// "better" primary among same-docKey expenses: has amount + payment proof, and
// a real invoice/receipt beats a bare booking (PRD §8 F2).
function score(e: ProcessedExpense): number {
  let s = 0;
  if (e.amountEUR != null) s += 4;
  if (e.paymentProofPresent) s += 2;
  if (e.docNature === "invoice" || e.docNature === "receipt") s += 1;
  return s;
}

export function dedupeBatch(expenses: ProcessedExpense[]): ProcessedExpense[] {
  const byKey = new Map<string, ProcessedExpense[]>();
  for (const e of expenses) {
    if (!byKey.has(e.docKey)) byKey.set(e.docKey, []);
    byKey.get(e.docKey)!.push(e);
  }

  for (const group of byKey.values()) {
    if (group.length < 2) continue;
    // choose primary
    const sorted = [...group].sort((a, b) => score(b) - score(a));
    const primary = sorted[0];
    const dups = sorted.slice(1);

    // booking+receipt merge: if primary lacks an amount but a dup has it, adopt it
    if (primary.amountEUR == null) {
      const withAmount = dups.find((d) => d.amountEUR != null);
      if (withAmount) {
        primary.amountEUR = withAmount.amountEUR;
        primary.originalAmount = withAmount.originalAmount;
        primary.originalCurrency = withAmount.originalCurrency;
        primary.vatRecoverable = withAmount.vatRecoverable ?? primary.vatRecoverable;
        primary.fx = withAmount.fx;
      }
    }
    for (const d of dups) {
      d.duplicateOfId = primary.id;
      primary.mergedFromIds.push(d.id);
    }
    const label =
      dups.some((d) => d.docNature !== primary.docNature)
        ? `Réservation + reçu du même paiement fusionnés (${primary.docKey.replace(/^DOC:/, "n° ")})`
        : `Doublon détecté (${primary.docKey.replace(/^DOC:/, "n° ")}) → compté une seule fois`;
    primary.alerts = Array.from(new Set([...primary.alerts, label]));
    if (!primary.reviewReasons.includes(label)) primary.reviewReasons.push(label);
    primary.needsReview = true;
  }

  return expenses;
}

/** Flag expenses whose docKey is already committed in the workbook ledger. */
export function markIdempotent(expenses: ProcessedExpense[], ledgerDocKeys: Set<string>): ProcessedExpense[] {
  for (const e of expenses) {
    if (e.duplicateOfId) continue;
    if (ledgerDocKeys.has(e.docKey)) {
      e.idempotentSkip = true;
      const msg = "Déjà traité lors d'un run précédent → ignoré";
      if (!e.reviewReasons.includes(msg)) e.reviewReasons.push(msg);
      if (!e.alerts.includes(msg)) e.alerts.push(msg);
    }
  }
  return expenses;
}

/** Expenses that will actually be written (not duplicates, not already committed). */
export function writableExpenses(expenses: ProcessedExpense[]): ProcessedExpense[] {
  return expenses.filter((e) => !e.duplicateOfId && !e.idempotentSkip);
}
