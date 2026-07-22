import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { committedReceipts } from "@/lib/expenses/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The expense summary shown in the UI: every COMMITTED expense, read from the
 * database (the mirror of the shared Google Sheet) — NOT from the master file.
 * The master is only an extraction template now. When nothing is committed the
 * UI shows the headers with a €0.00 total.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const rows = await committedReceipts();
  const total = Number(rows.reduce((s, r) => s + (r.amountEUR ?? 0), 0).toFixed(2));
  const sheets = [...new Set(rows.map((r) => r.sheetName).filter(Boolean))];
  return NextResponse.json({ rows, sheets, total, found: rows.length > 0 });
}
