import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { loadMaster } from "@/lib/expenses/storage";
import { loadWorkbook, getTemplateSheet, readLedger } from "@/lib/expenses/excel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Preview the master workbook's current expenses (its ledger), so the UI can
 * show the DB-stored master side-by-side without the user re-browsing it.
 * Accepts an uploaded `master` (wins) or `useSaved=true` (the DB default).
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const masterFile = form.get("master");
  let buf: Buffer | null = null;
  if (masterFile instanceof File && masterFile.size > 0) {
    buf = Buffer.from(await masterFile.arrayBuffer());
  } else if (form.get("useSaved") === "true") {
    buf = await loadMaster(user.email);
  }
  if (!buf) return NextResponse.json({ rows: [], sheets: [], total: 0, found: false });

  try {
    const wb = await loadWorkbook(buf);
    getTemplateSheet(wb); // throws if it's not the Matrice file
    const ledger = readLedger(wb);
    const rows = ledger.map((e) => ({
      sheetName: e.sheetName,
      traveler: e.travelerLabel || e.traveler,
      date: e.row.issueDate,
      vendor: e.row.vendor,
      category: e.row.category,
      amountEUR: e.row.amountEUR,
      vat: e.row.vatRecoverable,
      currency: e.row.originalCurrency,
      location: e.lieu,
    }));
    const total = Number(rows.reduce((s, r) => s + (r.amountEUR ?? 0), 0).toFixed(2));
    const sheets = [...new Set(rows.map((r) => r.sheetName))];
    return NextResponse.json({ rows, sheets, total, found: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message, rows: [], sheets: [], total: 0, found: true },
      { status: 200 },
    );
  }
}
