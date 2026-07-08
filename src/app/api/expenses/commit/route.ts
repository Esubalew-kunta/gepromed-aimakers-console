import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { commitBatch } from "@/lib/expenses/orchestrator";
import { loadMaster, saveMaster } from "@/lib/expenses/storage";
import type { ProcessedExpense } from "@/lib/expenses/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

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
    await saveMaster(user.email, buffer); // persist the updated master for next time
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": XLSX_MIME,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
