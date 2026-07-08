import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSessionUser } from "@/lib/auth";
import { analyzeBatch } from "@/lib/expenses/orchestrator";
import { isExtractionConfigured, type UploadedFile } from "@/lib/expenses/extract";
import { loadMaster, saveMaster, saveReceipt, recordRun } from "@/lib/expenses/storage";
import type { DepositContext } from "@/lib/expenses/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function mediaTypeOf(name: string, type: string): string {
  if (type && type !== "application/octet-stream") return type;
  const ext = name.toLowerCase().split(".").pop();
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (!isExtractionConfigured()) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configurée — l'extraction IA est indisponible." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide (multipart attendu)." }, { status: 400 });
  }

  // Resolve the master workbook: uploaded file wins; else the saved one.
  const masterFile = form.get("master");
  let masterBuffer: Buffer | null = null;
  let masterName = "Matrice LM_0226_rembt Frais.xlsx";
  if (masterFile instanceof File && masterFile.size > 0) {
    masterBuffer = Buffer.from(await masterFile.arrayBuffer());
    masterName = masterFile.name || masterName;
    await saveMaster(user.email, masterBuffer);
  } else if (form.get("useSaved") === "true") {
    masterBuffer = await loadMaster(user.email);
  }
  if (!masterBuffer) {
    return NextResponse.json(
      { error: "Aucun fichier maître fourni. Importez le fichier Matrice de Nathalie." },
      { status: 400 },
    );
  }

  // Receipt files
  const receiptFiles = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (receiptFiles.length === 0) {
    return NextResponse.json({ error: "Aucun justificatif fourni." }, { status: 400 });
  }

  const runId = crypto.randomUUID();
  const uploaded: UploadedFile[] = [];
  for (const f of receiptFiles) {
    const buf = Buffer.from(await f.arrayBuffer());
    const hash = createHash("sha256").update(new Uint8Array(buf)).digest("hex");
    uploaded.push({ name: f.name, mediaType: mediaTypeOf(f.name, f.type), base64: buf.toString("base64"), hash });
    void saveReceipt(user.email, runId, f.name, buf, mediaTypeOf(f.name, f.type));
  }

  const deposit: DepositContext = {
    description: String(form.get("description") || ""),
    traveler: String(form.get("traveler") || "") || undefined,
    purpose: String(form.get("purpose") || "") || undefined,
    tripHint: String(form.get("tripHint") || "") || undefined,
    period: String(form.get("period") || "") || undefined,
  };

  try {
    const result = await analyzeBatch({ files: uploaded, deposit, masterBuffer, runId });
    result.masterFileName = masterName;
    void recordRun(user.email, result, "analyzed");
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
