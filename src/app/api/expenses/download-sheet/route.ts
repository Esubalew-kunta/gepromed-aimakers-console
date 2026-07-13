import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface SheetValuesResponse {
  values?: string[][];
}

/**
 * Downloads the LIVE Google Sheet (everyone's committed rows, current state)
 * as an .xlsx — not the app's own Excel master, which only reflects whatever
 * master file was selected locally. Reads via the n8n export webhook (Sheets
 * API values.get, same OAuth2 scope already used for the commit path) and
 * renders the raw grid into a workbook here, since the credential doesn't
 * have Drive API scope for a native server-side export.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const url = process.env.EXPENSE_SHEET_EXPORT_URL;
  if (!url) {
    return NextResponse.json({ error: "Export du Google Sheet non configuré (EXPENSE_SHEET_EXPORT_URL)." }, { status: 400 });
  }

  let data: SheetValuesResponse;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`n8n a répondu ${res.status}`);
    data = (await res.json()) as SheetValuesResponse;
  } catch (e) {
    return NextResponse.json({ error: `Lecture du Google Sheet impossible : ${(e as Error).message}` }, { status: 502 });
  }

  const rows = data.values ?? [];
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("expenses");
  for (const row of rows) ws.addRow(row);
  ws.columns.forEach((col) => (col.width = 16));

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="expenses-google-sheet.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
