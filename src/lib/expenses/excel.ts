import "server-only";
import ExcelJS from "exceljs";
import { MATRICE, CATEGORY_COLUMN, type CategoryKey, type FxResult } from "./types";

/**
 * Excel engine — appends expenses into Nathalie's EXISTING master workbook
 * (Matrice LM_0226_rembt Frais.xlsx), preserving every existing sheet.
 *
 * Validated against the real file + the client-accepted demo:
 * - ExcelJS round-trips the real master faithfully (existing sheets, the
 *   `Dépenses` table, formulas, defined name `Kilométrage`, styles all survive).
 * - New trip sheets are PLAIN cells + explicit formulas (exact shape of the
 *   accepted `notes-de-frais-demo-nathalie.xlsx`), with per-cell styles copied
 *   from the `Matrice` template so they look identical.
 *
 * Model for correctness across runs + row locking:
 * - A hidden `_Ledger` sheet is the append-only source of truth: one JSON row
 *   per committed expense (with its full row data + validated flag).
 * - On every commit we REBUILD the sheets WE manage from the ledger (so new
 *   receipts for an existing trip append correctly and validated rows are
 *   reproduced byte-identically = locked). Nathalie's own pre-existing sheets
 *   (Dubaï, Paris, the `Matrice` template…) are never touched.
 * - `Synthèse` is regenerated from the ledger so it always reconciles.
 */

// The data needed to render one expense row on a trip sheet.
export interface SheetRow {
  issueDate: string | null; // ISO
  purpose: string | null;
  vendor: string | null;
  location: string | null;
  category: CategoryKey | null;
  amountEUR: number | null;
  vatRecoverable: number | null;
  originalCurrency: string | null;
  fx: FxResult | null;
}

// Grouping metadata for a managed trip sheet.
export interface TripGroup {
  sheetName: string;
  tripLabel: string;
  traveler: string;
  travelerLabel: string;
  period: string;
  lieu: string;
  rows: SheetRow[];
}

// One committed expense persisted in _Ledger.
export interface LedgerEntry {
  docKey: string;
  fileHash: string;
  runId: string;
  validated: boolean;
  sheetName: string;
  tripLabel: string;
  traveler: string;
  travelerLabel: string;
  period: string;
  lieu: string;
  row: SheetRow;
}

// ---------------------------------------------------------------------------

export async function loadWorkbook(data: ArrayBuffer | Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  const buf = data instanceof Buffer ? data : Buffer.from(data);
  await wb.xlsx.load(buf as unknown as ExcelJS.Buffer);
  return wb;
}

export async function workbookToBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}

export function getTemplateSheet(wb: ExcelJS.Workbook): ExcelJS.Worksheet {
  const ws = wb.getWorksheet(MATRICE.templateSheet);
  if (!ws) {
    throw new Error(
      `Le fichier ne contient pas la feuille modèle « ${MATRICE.templateSheet} ». ` +
        `Vérifiez que c'est bien le fichier Matrice de Nathalie.`,
    );
  }
  return ws;
}

const ILLEGAL_SHEET = /[\\/?*[\]:]/g;

export function sanitizeSheetName(base: string): string {
  return (base || "Feuille").replace(ILLEGAL_SHEET, "").trim().slice(0, 31) || "Feuille";
}

function cloneStyle(style: Partial<ExcelJS.Style> | undefined): Partial<ExcelJS.Style> {
  if (!style) return {};
  return {
    numFmt: style.numFmt,
    font: style.font ? { ...style.font } : undefined,
    alignment: style.alignment ? { ...style.alignment } : undefined,
    border: style.border ? JSON.parse(JSON.stringify(style.border)) : undefined,
    fill: style.fill ? JSON.parse(JSON.stringify(style.fill)) : undefined,
  };
}

function copyCell(src: ExcelJS.Cell, dst: ExcelJS.Cell, copyValue: boolean) {
  if (copyValue) dst.value = src.value ?? null;
  const s = cloneStyle(src.style);
  if (s.numFmt) dst.numFmt = s.numFmt;
  if (s.font) dst.font = s.font;
  if (s.alignment) dst.alignment = s.alignment;
  if (s.border) dst.border = s.border;
  if (s.fill) dst.fill = s.fill as ExcelJS.Fill;
}

function fmtDateLabel(iso: string | null): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

// ---------------------------------------------------------------------------
// Build one trip sheet from scratch (plain cells + formulas + template styles)
// ---------------------------------------------------------------------------

export function buildTripSheet(
  wb: ExcelJS.Workbook,
  template: ExcelJS.Worksheet,
  group: TripGroup,
  sheetName: string,
): ExcelJS.Worksheet {
  const ws = wb.addWorksheet(sheetName);

  for (let c = 1; c <= 20; c++) {
    const w = template.getColumn(c).width;
    if (w) ws.getColumn(c).width = w;
  }

  const merges: string[] = (template.model as unknown as { merges?: string[] }).merges ?? [];
  for (const rng of merges) {
    const topRow = parseInt(rng.replace(/[^0-9:]/g, "").split(":")[0] || "99", 10);
    if (topRow <= 12) {
      try { ws.mergeCells(rng); } catch { /* ignore overlaps */ }
    }
  }

  // header/label scaffold rows 1..13
  for (let r = 1; r <= MATRICE.headerRow; r++) {
    ws.getRow(r).height = template.getRow(r).height;
    for (let c = 1; c <= 20; c++) copyCell(template.getCell(r, c), ws.getCell(r, c), true);
  }

  ws.getCell(MATRICE.nameCell).value = group.travelerLabel || group.traveler || "";
  ws.getCell(MATRICE.serviceCell).value = "GEPROMED";
  ws.getCell(MATRICE.periodCell).value = group.period || "";

  const firstRow = MATRICE.firstDataRow;
  let r = firstRow;
  for (const row of group.rows) {
    ws.getRow(r).height = template.getRow(firstRow).height;
    for (let c = 1; c <= 20; c++) copyCell(template.getCell(firstRow, c), ws.getCell(r, c), false);
    writeExpenseRow(ws, r, row);
    r++;
  }
  const lastDataRow = r - 1;

  const totalRow = Math.max(r, firstRow);
  ws.getRow(totalRow).height = template.getRow(34).height;
  for (let c = 1; c <= 20; c++) copyCell(template.getCell(34, c), ws.getCell(totalRow, c), false);
  ws.getCell(`B${totalRow}`).value = "Total";
  if (lastDataRow >= firstRow) {
    const sumCols = ["F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "S"];
    for (const col of sumCols) {
      ws.getCell(`${col}${totalRow}`).value = {
        formula: `SUBTOTAL(109,${col}${firstRow}:${col}${lastDataRow})`,
      } as ExcelJS.CellFormulaValue;
    }
  }
  ws.getCell(MATRICE.reimbTotalCell).value = {
    formula: `${MATRICE.totalCol}${totalRow}`,
  } as ExcelJS.CellFormulaValue;

  return ws;
}

function writeExpenseRow(ws: ExcelJS.Worksheet, row: number, exp: SheetRow) {
  const set = (col: string, v: ExcelJS.CellValue) => (ws.getCell(`${col}${row}`).value = v);

  set("B", fmtDateLabel(exp.issueDate));
  set("C", "GEPROMED");
  set("D", exp.purpose || exp.vendor || "Déplacement professionnel");
  set("E", exp.location || "—");

  const eur = exp.amountEUR;
  if (exp.category && eur != null) set(CATEGORY_COLUMN[exp.category].col, Number(eur.toFixed(2)));
  if (exp.vatRecoverable != null) set(MATRICE.vatCol, Number(exp.vatRecoverable.toFixed(2)));
  if (exp.originalCurrency && exp.originalCurrency !== "EUR") set(MATRICE.currencyCol, exp.originalCurrency);

  ws.getCell(`${MATRICE.mileageReimbCol}${row}`).value = {
    formula: `+Kilométrage*N${row}`,
  } as ExcelJS.CellFormulaValue;
  ws.getCell(`${MATRICE.totalCol}${row}`).value = {
    formula: `SUM(${MATRICE.firstCategoryCol}${row}:${MATRICE.lastCategoryCol}${row})`,
  } as ExcelJS.CellFormulaValue;

  if (exp.fx && exp.category && exp.originalCurrency && exp.originalCurrency !== "EUR") {
    const { col } = CATEGORY_COLUMN[exp.category];
    const f = exp.fx;
    const dateNote = f.dateAdjusted
      ? `${f.rateDate} (jour ouvré précédent, demandé ${f.requestedDate})`
      : f.rateDate;
    ws.getCell(`${col}${row}`).note =
      `Montant d'origine : ${f.originalAmount} ${f.originalCurrency}\n` +
      `Taux : 1 EUR = ${f.rate} ${f.originalCurrency}\n` +
      `Date du taux : ${dateNote}\nSource : ${f.source}`;
  }
}

// ---------------------------------------------------------------------------
// _Ledger (JSON rows) — idempotence / dedup / locking source of truth
// ---------------------------------------------------------------------------

const LEDGER_COLS = ["docKey", "fileHash", "sheetName", "runId", "validated", "json"] as const;

export function readLedger(wb: ExcelJS.Workbook): LedgerEntry[] {
  const ws = wb.getWorksheet(MATRICE.ledgerSheet);
  if (!ws) return [];
  const out: LedgerEntry[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const json = row.getCell(6).value;
    if (json == null) return;
    try {
      out.push(JSON.parse(String(json)) as LedgerEntry);
    } catch {
      /* skip malformed */
    }
  });
  return out;
}

export function writeLedger(wb: ExcelJS.Workbook, entries: LedgerEntry[]) {
  const old = wb.getWorksheet(MATRICE.ledgerSheet);
  if (old) wb.removeWorksheet(old.id);
  const ws = wb.addWorksheet(MATRICE.ledgerSheet);
  ws.state = "veryHidden";
  ws.addRow(LEDGER_COLS as unknown as string[]);
  for (const e of entries) {
    ws.addRow([e.docKey, e.fileHash, e.sheetName, e.runId, e.validated ? "true" : "false", JSON.stringify(e)]);
  }
}

/** Managed sheet names = those our ledger created (never Nathalie's own sheets). */
export function managedSheetNames(ledger: LedgerEntry[]): Set<string> {
  return new Set(ledger.map((e) => e.sheetName));
}

const RESERVED = new Set([MATRICE.templateSheet, MATRICE.summarySheet, MATRICE.ledgerSheet].map((s) => s.toLowerCase()));

/**
 * Resolve a target sheet name so we NEVER overwrite Nathalie's own pre-existing
 * sheets. If `desired` is one we already manage, reuse it (append to the trip).
 * If it collides (case-insensitively) with any other existing sheet, pick a
 * unique variant instead.
 */
export function resolveSheetName(
  wb: ExcelJS.Workbook,
  ledgerManaged: Set<string>,
  desired: string,
  claimed: Set<string>,
): string {
  const base = sanitizeSheetName(desired);
  const managedLc = new Set([...ledgerManaged].map((s) => s.toLowerCase()));
  if (managedLc.has(base.toLowerCase())) return base; // our own trip sheet
  const taken = new Set<string>();
  wb.worksheets.forEach((w) => taken.add(w.name.toLowerCase()));
  claimed.forEach((c) => taken.add(c.toLowerCase()));
  RESERVED.forEach((r) => taken.add(r));
  if (!taken.has(base.toLowerCase())) return base;
  for (let n = 2; n < 200; n++) {
    const cand = sanitizeSheetName(`${base.slice(0, 27)} (${n})`);
    if (!taken.has(cand.toLowerCase())) return cand;
  }
  return sanitizeSheetName(`${base.slice(0, 24)} ${Date.now().toString().slice(-5)}`);
}

/**
 * Rebuild every sheet we manage from the ledger, so new rows append to existing
 * trips and validated rows are reproduced unchanged. Reserved sheets and
 * Nathalie's own sheets are left intact.
 */
export function rebuildManagedSheets(wb: ExcelJS.Workbook, template: ExcelJS.Worksheet, ledger: LedgerEntry[]) {
  const bySheet = new Map<string, LedgerEntry[]>();
  for (const e of ledger) {
    if (!bySheet.has(e.sheetName)) bySheet.set(e.sheetName, []);
    bySheet.get(e.sheetName)!.push(e);
  }
  for (const [sheetName, entries] of bySheet) {
    // remove any existing sheet with this name (case-insensitive) before rebuild
    let dup = wb.worksheets.find((w) => w.name.toLowerCase() === sheetName.toLowerCase());
    while (dup) {
      wb.removeWorksheet(dup.id);
      dup = wb.worksheets.find((w) => w.name.toLowerCase() === sheetName.toLowerCase());
    }
    const first = entries[0];
    const group: TripGroup = {
      sheetName,
      tripLabel: first.tripLabel,
      traveler: first.traveler,
      travelerLabel: first.travelerLabel,
      period: first.period,
      lieu: first.lieu,
      rows: entries.map((e) => e.row),
    };
    buildTripSheet(wb, template, group, sheetName);
  }
}

// ---------------------------------------------------------------------------
// Synthèse — regenerated from the ledger every commit
// ---------------------------------------------------------------------------

export function rebuildSummary(
  wb: ExcelJS.Workbook,
  ledger: LedgerEntry[],
  employeeName: string,
  alerts: string[],
) {
  const old = wb.getWorksheet(MATRICE.summarySheet);
  if (old) wb.removeWorksheet(old.id);
  const ws = wb.addWorksheet(MATRICE.summarySheet);
  wb.worksheets.splice(wb.worksheets.indexOf(ws), 1);
  wb.worksheets.unshift(ws);

  ws.getColumn(1).width = 2;
  [26, 16, 20, 22, 20, 14, 14].forEach((w, i) => (ws.getColumn(i + 2).width = w));

  ws.getCell("B1").value = "Synthèse — notes de frais générées automatiquement";
  ws.getCell("B1").font = { bold: true, size: 13 };
  ws.getCell("B2").value = "Préparé par";
  ws.getCell("C2").value = employeeName;

  ["Voyage / trip", "Feuille", "Voyageur", "Lieu", "Période", "Justificatifs", "Total (EUR)"].forEach((h, i) => {
    const c = ws.getCell(4, i + 2);
    c.value = h;
    c.font = { bold: true };
  });

  const bySheet = new Map<string, LedgerEntry[]>();
  for (const e of ledger) {
    if (!bySheet.has(e.sheetName)) bySheet.set(e.sheetName, []);
    bySheet.get(e.sheetName)!.push(e);
  }
  let row = 5;
  let grand = 0;
  for (const [sheet, entries] of bySheet) {
    const first = entries[0];
    const total = entries.reduce((s, e) => s + (e.row.amountEUR ?? 0), 0);
    grand += total;
    [first.tripLabel, sheet, first.travelerLabel, first.lieu, first.period, entries.length, Number(total.toFixed(2))]
      .forEach((v, i) => (ws.getCell(row, i + 2).value = v as ExcelJS.CellValue));
    row++;
  }
  ws.getCell(row, 7).value = "Total général";
  ws.getCell(row, 7).font = { bold: true };
  ws.getCell(row, 8).value = Number(grand.toFixed(2));
  ws.getCell(row, 8).font = { bold: true };

  if (alerts.length) {
    row += 2;
    ws.getCell(`B${row}`).value = "Alertes à vérifier";
    ws.getCell(`B${row}`).font = { bold: true };
    for (const a of alerts) {
      row++;
      ws.getCell(`B${row}`).value = a;
    }
  }
}
