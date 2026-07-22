import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSessionUser } from "@/lib/auth";
import { analyzeBatch, summarize } from "@/lib/expenses/orchestrator";
import { isExtractionConfigured, type UploadedFile } from "@/lib/expenses/extract";
import { loadMaster, saveMaster, saveReceipt, recordRun, committedDocKeys } from "@/lib/expenses/storage";
import type { DepositContext } from "@/lib/expenses/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Hard caps so a bad batch fails fast with a clear message instead of
// burning LLM time/cost on files the vision API can't read anyway.
// MAX_FILE_SIZE_BYTES is set below the platform's own multipart body-size
// ceiling (empirically between 8MB and 12MB in this environment) so our
// clear "trop volumineux" message fires instead of the request dying
// upstream with a generic "Requête invalide (multipart attendu)".
const MAX_FILES_PER_BATCH = 20;
const MAX_FILE_SIZE_BYTES = 6 * 1024 * 1024; // 6MB
const SUPPORTED_MEDIA_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

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
      { error: "ANTHROPIC_API_KEY non configurée, l'extraction IA est indisponible." },
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
  // Batch-wide operational limit (cost/latency, not a per-file content issue)
  // — this one still rejects the whole request, since there's no single bad
  // file to point at and no reasonable subset to silently drop.
  if (receiptFiles.length > MAX_FILES_PER_BATCH) {
    return NextResponse.json(
      { error: `Trop de fichiers en un seul lot (${receiptFiles.length}). Limite : ${MAX_FILES_PER_BATCH}. Divisez en plusieurs lots.` },
      { status: 400 },
    );
  }

  // Per-file content issues (too large / unsupported type) are routed into
  // the same "skipped" mechanism the extraction step already uses for
  // unreadable receipts, so the user sees WHY each file was dropped inline
  // in the results table instead of the whole batch failing on one bad file.
  const preSkipped: { file: string; reason: string }[] = [];
  const usableFiles = receiptFiles.filter((f) => {
    if (f.size > MAX_FILE_SIZE_BYTES) {
      preSkipped.push({ file: f.name, reason: `Fichier trop volumineux (max ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} Mo).` });
      return false;
    }
    if (!SUPPORTED_MEDIA_TYPES.has(mediaTypeOf(f.name, f.type))) {
      preSkipped.push({ file: f.name, reason: "Type de fichier non pris en charge (PDF ou image uniquement)." });
      return false;
    }
    return true;
  });

  const runId = crypto.randomUUID();

  if (usableFiles.length === 0) {
    const result = summarize(runId, masterName, [], preSkipped);
    void recordRun(user.email, result, "analyzed");
    return NextResponse.json(result);
  }

  const uploaded: UploadedFile[] = [];
  for (const f of usableFiles) {
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
    const committedKeys = await committedDocKeys();
    const result = await analyzeBatch({ files: uploaded, deposit, masterBuffer, runId, committedKeys });
    result.masterFileName = masterName;
    if (preSkipped.length > 0) {
      result.skipped = [...preSkipped, ...result.skipped];
      result.alerts = [...preSkipped.map((s) => `${s.file} ignoré : ${s.reason}`), ...result.alerts];
    }
    void recordRun(user.email, result, "analyzed");
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
