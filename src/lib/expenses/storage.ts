import "server-only";
import { supabaseServer } from "@/lib/supabase";
import type { AnalyzeResult, ProcessedExpense } from "./types";

/**
 * Best-effort Supabase persistence for the expenses feature. Every function
 * no-ops (returns null / does nothing) when Supabase or the `expense-files`
 * bucket / tables aren't present, so the feature works fully without them
 * (upload the master each run); with them, the master is remembered and every
 * run is audited.
 */

const BUCKET = "expense-files";
const MASTER_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function masterPath(email: string): string {
  return `${email}/master.xlsx`;
}

export async function saveMaster(email: string, buffer: Buffer): Promise<void> {
  const sb = supabaseServer();
  if (!sb) return;
  try {
    await sb.storage.from(BUCKET).upload(masterPath(email), buffer, { contentType: MASTER_XLSX, upsert: true });
  } catch {
    /* best-effort */
  }
}

export async function loadMaster(email: string): Promise<Buffer | null> {
  const sb = supabaseServer();
  if (!sb) return null;
  try {
    const { data, error } = await sb.storage.from(BUCKET).download(masterPath(email));
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  } catch {
    return null;
  }
}

export async function masterInfo(email: string): Promise<{ exists: boolean } | null> {
  const sb = supabaseServer();
  if (!sb) return null;
  try {
    const { data } = await sb.storage.from(BUCKET).list(email, { search: "master.xlsx" });
    return { exists: Boolean(data && data.some((f) => f.name === "master.xlsx")) };
  } catch {
    return null;
  }
}

export async function saveReceipt(email: string, runId: string, name: string, buffer: Buffer, mediaType: string): Promise<string | null> {
  const sb = supabaseServer();
  if (!sb) return null;
  const path = `${email}/${runId}/${name}`;
  try {
    await sb.storage.from(BUCKET).upload(path, buffer, { contentType: mediaType, upsert: true });
    return path;
  } catch {
    return null;
  }
}

export async function recordRun(
  email: string,
  result: AnalyzeResult,
  status: "analyzed" | "committed",
): Promise<void> {
  const sb = supabaseServer();
  if (!sb) return;
  try {
    await sb.from("expense_runs").upsert({
      id: result.runId,
      created_by: email,
      master_file: result.masterFileName,
      status,
      grand_total_eur: result.grandTotalEUR,
      summary: result.groups,
      alerts: result.alerts,
    });
    const rows = result.expenses
      .filter((e: ProcessedExpense) => !e.duplicateOfId && !e.idempotentSkip)
      .map((e: ProcessedExpense) => ({
        run_id: result.runId,
        doc_key: e.docKey,
        file_hash: e.fileHash,
        source_file: e.sourceFile,
        sheet_name: e.sheetName,
        trip_label: e.tripLabel,
        traveler: e.traveler,
        period: e.period,
        issue_date: e.issueDate,
        category: e.category,
        original_amount: e.originalAmount,
        original_currency: e.originalCurrency,
        amount_eur: e.amountEUR,
        vat_recoverable: e.vatRecoverable,
        fx: e.fx,
        needs_review: e.needsReview,
        alerts: e.alerts,
        validated: status === "committed",
      }));
    if (rows.length) await sb.from("expense_receipts").insert(rows);
  } catch {
    /* best-effort audit */
  }
}
