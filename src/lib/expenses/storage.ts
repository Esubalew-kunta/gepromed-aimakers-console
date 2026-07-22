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
// The master is overwritten constantly (every commit / reset). Supabase Storage
// otherwise serves downloads with a 1h Cache-Control, so a fresh read right
// after a write returned the STALE workbook for ~15-20s — which made the preview
// show old rows after a blank/commit and briefly broke cross-run idempotence.
// cacheControl "0" makes each overwrite immediately visible on the next read.
const MASTER_UPLOAD = { contentType: MASTER_XLSX, upsert: true, cacheControl: "0" } as const;

function masterPath(email: string): string {
  return `${email}/master.xlsx`;
}

export async function saveMaster(email: string, buffer: Buffer): Promise<void> {
  const sb = supabaseServer();
  if (!sb) return;
  try {
    await sb.storage.from(BUCKET).upload(masterPath(email), buffer, MASTER_UPLOAD);
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

/**
 * A committed expense line as shown in the preview / summary. Sourced from the
 * database (the mirror of the shared Google Sheet), NOT from the master file —
 * the master is only an extraction template now.
 */
export interface CommittedRow {
  docKey: string | null;
  sourceFile: string | null;
  sheetName: string | null;
  traveler: string | null;
  date: string | null;
  category: string | null;
  amountEUR: number | null;
  vat: number | null;
  currency: string | null;
}

/**
 * Every committed expense (global — all users, matching the one shared Sheet),
 * deduped by doc_key so the preview mirrors the Google Sheet (which upserts by
 * docKey). Newest committed row wins on a repeated docKey.
 */
export async function committedReceipts(): Promise<CommittedRow[]> {
  const sb = supabaseServer();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("expense_receipts")
      .select(
        "doc_key, source_file, sheet_name, traveler, issue_date, category, amount_eur, vat_recoverable, original_currency, created_at",
      )
      .eq("validated", true)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    const byKey = new Map<string, (typeof data)[number]>();
    for (const r of data) {
      const key = r.doc_key || `${r.source_file}:${r.issue_date}:${r.amount_eur}`;
      byKey.set(key, r); // asc by created_at → latest committed wins
    }
    return [...byKey.values()]
      .map((r) => ({
        docKey: r.doc_key,
        sourceFile: r.source_file,
        sheetName: r.sheet_name,
        traveler: r.traveler,
        date: r.issue_date,
        category: r.category,
        amountEUR: r.amount_eur != null ? Number(r.amount_eur) : null,
        vat: r.vat_recoverable != null ? Number(r.vat_recoverable) : null,
        currency: r.original_currency,
      }))
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  } catch {
    return [];
  }
}

/**
 * The set of already-committed doc_keys (global), used for "already processed"
 * idempotence at analyze time now that the master no longer stores a ledger.
 */
export async function committedDocKeys(): Promise<Set<string>> {
  const sb = supabaseServer();
  if (!sb) return new Set();
  try {
    const { data, error } = await sb.from("expense_receipts").select("doc_key").eq("validated", true);
    if (error || !data) return new Set();
    return new Set(data.map((r) => r.doc_key).filter((k): k is string => Boolean(k)));
  } catch {
    return new Set();
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
