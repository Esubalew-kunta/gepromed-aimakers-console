import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { summarize } from "@/lib/expenses/orchestrator";
import { writableExpenses } from "@/lib/expenses/dedup";
import { recordRun } from "@/lib/expenses/storage";
import type { ProcessedExpense } from "@/lib/expenses/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Commit = mirror the reviewed rows to the shared Google Sheet via the n8n
 * webhook (idempotent by docKey) AND record them in the database. The database
 * (mirror of the Sheet) is the source of truth for the preview/summary; the
 * master workbook is NOT touched — it's only an extraction template.
 * Env-gated + best-effort on the Sheet push: a commit must never fail because
 * the mirror is down.
 */
async function pushToGoogleSheet(
  runId: string,
  employeeName: string,
  expenses: ProcessedExpense[],
): Promise<{ ok: boolean; url: string | null }> {
  const url = process.env.EXPENSE_SHEET_WEBHOOK_URL;
  if (!url) return { ok: false, url: null };
  const rows = expenses
    .filter((e) => e.docKey && !e.duplicateOfId && !e.idempotentSkip)
    .map((e) => ({
      docKey: e.docKey,
      issueDateLabel: e.issueDateLabel,
      etude: e.etude,
      purpose: e.purpose,
      location: e.location,
      originalCurrency: e.originalCurrency,
      amountEUR: e.amountEUR,
      category: e.category,
      vatRecoverable: e.vatRecoverable,
      distanceKm: e.distanceKm,
    }));
  if (rows.length === 0) return { ok: false, url: null };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET ?? "",
      },
      body: JSON.stringify({ runId, employeeName, rows }),
    });
    if (!res.ok) return { ok: false, url: null };
    // The n8n workflow echoes back the target sheet URL so the user can open it.
    let sheetUrl: string | null = null;
    try {
      const body = await res.json();
      if (body && typeof body.sheetUrl === "string") sheetUrl = body.sheetUrl;
    } catch {
      /* non-JSON response — still a successful push */
    }
    return { ok: true, url: sheetUrl ?? process.env.EXPENSE_SHEET_URL ?? null };
  } catch {
    return { ok: false, url: null };
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide (multipart attendu)." }, { status: 400 });
  }

  let expenses: ProcessedExpense[];
  try {
    expenses = JSON.parse(String(form.get("expenses") || "[]")) as ProcessedExpense[];
  } catch {
    return NextResponse.json({ error: "Liste des dépenses invalide." }, { status: 400 });
  }
  if (!Array.isArray(expenses) || expenses.length === 0) {
    return NextResponse.json({ error: "Aucune dépense à écrire." }, { status: 400 });
  }

  const writable = writableExpenses(expenses);
  if (writable.length === 0) {
    return NextResponse.json({ error: "Aucune dépense à enregistrer (doublons/déjà traités)." }, { status: 400 });
  }

  const employeeName = String(form.get("employeeName") || "") || "Nathalie";
  const runId = String(form.get("runId") || crypto.randomUUID());
  const fileName = String(form.get("fileName") || "Matrice");

  try {
    // Mirror to the shared Google Sheet (idempotent, best-effort).
    const sheet = await pushToGoogleSheet(runId, employeeName, expenses);
    // Record the committed rows in the DB — this is what the preview/summary reads.
    await recordRun(user.email, summarize(runId, fileName, expenses, []), "committed");
    return NextResponse.json({ ok: true, written: writable.length, sheetSynced: sheet.ok, sheetUrl: sheet.url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
