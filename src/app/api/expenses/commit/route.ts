import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { commitBatch, summarize } from "@/lib/expenses/orchestrator";
import { loadMaster, saveMaster, recordRun } from "@/lib/expenses/storage";
import type { ProcessedExpense } from "@/lib/expenses/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * After the master is saved to the DB, mirror the committed rows to the Google
 * Sheet via the n8n webhook (idempotent by docKey). Env-gated + best-effort:
 * returns false (never throws) when EXPENSE_SHEET_WEBHOOK_URL is unset or n8n is
 * unreachable — a commit must never fail because the mirror is down.
 */
async function pushToGoogleSheet(
  runId: string,
  employeeName: string,
  expenses: ProcessedExpense[],
): Promise<boolean> {
  const url = process.env.EXPENSE_SHEET_WEBHOOK_URL;
  if (!url) return false;
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
  if (rows.length === 0) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET ?? "",
      },
      body: JSON.stringify({ runId, employeeName, rows }),
    });
    return res.ok;
  } catch {
    return false;
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

  // master: uploaded file wins, else the saved one
  const masterFile = form.get("master");
  let masterBuffer: Buffer | null = null;
  if (masterFile instanceof File && masterFile.size > 0) {
    masterBuffer = Buffer.from(await masterFile.arrayBuffer());
  } else if (form.get("useSaved") === "true") {
    masterBuffer = await loadMaster(user.email);
  }
  if (!masterBuffer) {
    return NextResponse.json({ error: "Fichier maître introuvable pour l'écriture." }, { status: 400 });
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

  const employeeName = String(form.get("employeeName") || "") || "Nathalie";
  const runId = String(form.get("runId") || crypto.randomUUID());
  const fileName = String(form.get("fileName") || "Matrice LM_0226_rembt Frais.xlsx");

  try {
    const { buffer } = await commitBatch({ masterBuffer, expenses, employeeName, runId });
    await saveMaster(user.email, buffer); // persist the updated master in Supabase storage for next time
    // Mirror the committed rows to the Google Sheet (idempotent, best-effort).
    const sheetSynced = await pushToGoogleSheet(runId, employeeName, expenses);
    // Record the committed data in the DB audit trail (validated = locked).
    void recordRun(user.email, summarize(runId, fileName, expenses, []), "committed");
    const written = expenses.filter((e) => !e.duplicateOfId && !e.idempotentSkip).length;
    return NextResponse.json({ ok: true, written, sheetSynced });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
