"use client";

/**
 * Builds a downloadable .xlsx entirely in the browser — no server call — that
 * mirrors the real column layout of Matrice LM_0226_rembt Frais.xlsx: one
 * sheet per trip, the same 18 expense columns in the same order, the same
 * header block, and live SUM formulas (not pre-baked numbers) so it behaves
 * like the file Nathalie already uses.
 */
import * as XLSX from "xlsx";
import {
  type ExpenseReceiptFixture,
  eurAmountOf,
  groupByTrip,
} from "@/lib/seed/expenses";

const COLUMNS = [
  "Date",
  "Étude",
  "Objet",
  "Lieu du déplacement",
  "Billet d'avion",
  "Hébergement",
  "Train / Métro",
  "Taxi",
  "Autoroute",
  "Parking",
  "Repas et pourboires",
  "Conférences et séminaires",
  "Kilomètres",
  "Remboursement du kilométrage",
  "Divers",
  "TVA récupérable",
  "Devise de dépense",
  "Total",
] as const;

// Column letters for the sheet, column A left blank as a gutter (same as the real file).
const TOTAL_COL = "S"; // matches COLUMNS[17] = "Total"
const FIRST_CATEGORY_COL = "F"; // Billet d'avion
const LAST_CATEGORY_COL = "P"; // Divers

function receiptRow(r: ExpenseReceiptFixture): (string | number)[] {
  const eur = eurAmountOf(r);
  const cell = (cat: string) => (r.category === cat ? eur : "");
  return [
    r.invoiceDateLabel,
    r.trip.etude,
    r.vendor,
    r.trip.lieu,
    cell("Billet d'avion"),
    cell("Hébergement"),
    cell("Train / Métro"),
    cell("Taxi"),
    cell("Autoroute"),
    cell("Parking"),
    cell("Repas et pourboires"),
    cell("Conférences et séminaires"),
    "", // Kilomètres
    "", // Remboursement du kilométrage
    cell("Divers"),
    r.vatRecoverable ?? "",
    r.originalCurrency !== "EUR" ? r.originalCurrency : "",
    "", // Total — written as a formula below, not a value
  ];
}

function sanitizeSheetName(name: string, used: Set<string>): string {
  let base = name.replace(/[\\/?*[\]:]/g, "").slice(0, 31) || "Sheet";
  let candidate = base;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base.slice(0, 28)} (${n++})`;
  }
  used.add(candidate);
  return candidate;
}

function buildTripSheet(
  trip: ExpenseReceiptFixture["trip"],
  receipts: ExpenseReceiptFixture[],
  employeeName: string,
): XLSX.WorkSheet {
  const headerRow = [...COLUMNS];
  const dataRows = receipts.map(receiptRow);
  const firstDataRow = 6; // 1-indexed Excel row where receipt data starts
  const lastDataRow = firstDataRow + dataRows.length - 1;
  const totalRow = lastDataRow + 1;

  const aoa: (string | number)[][] = [
    ["", "", "", "", "", "Rapport de dépenses de déplacement"],
    ["", "Nom", employeeName],
    ["", "Service", "GEPROMED"],
    ["", "Période", trip.period],
    ["", ...headerRow],
    ...dataRows.map((row) => ["", ...row]),
    ["", "Total"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Per-row Total = SUM(Billet d'avion..Divers) for that row, live formula.
  for (let row = firstDataRow; row <= lastDataRow; row++) {
    ws[`${TOTAL_COL}${row}`] = {
      t: "n",
      f: `SUM(${FIRST_CATEGORY_COL}${row}:${LAST_CATEGORY_COL}${row})`,
    };
  }

  // Bottom Total row: one SUM formula per category column, plus the grand total.
  const summedCols = [FIRST_CATEGORY_COL, "G", "H", "I", "J", "K", "L", "M", "P", TOTAL_COL];
  for (const col of summedCols) {
    ws[`${col}${totalRow}`] = {
      t: "n",
      f: `SUM(${col}${firstDataRow}:${col}${lastDataRow})`,
    };
  }

  // Header block: reimbursement due, referencing the grand total.
  ws["N3"] = { t: "s", v: "Remboursement total dû" };
  ws["O3"] = { t: "n", f: `${TOTAL_COL}${totalRow}` };

  ws["!cols"] = [
    { wch: 2 },
    { wch: 11 },
    { wch: 14 },
    { wch: 34 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 9 },
    { wch: 9 },
    { wch: 9 },
    { wch: 14 },
    { wch: 16 },
    { wch: 11 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];

  return ws;
}

function buildSummarySheet(
  groups: ReturnType<typeof groupByTrip>,
  employeeName: string,
): XLSX.WorkSheet {
  const grandTotal = groups.reduce((sum, g) => sum + g.totalEur, 0);
  const aoa: (string | number)[][] = [
    ["", "Synthèse — notes de frais générées automatiquement"],
    ["", "Collaborateur", employeeName],
    [""],
    ["", "Voyage / trip", "Feuille", "Lieu", "Période", "Nombre de justificatifs", "Total (EUR)"],
    ...groups.map((g) => [
      "",
      g.trip.label,
      g.trip.sheetName,
      g.trip.lieu,
      g.trip.period,
      g.receipts.length,
      Number(g.totalEur.toFixed(2)),
    ]),
    ["", "", "", "", "", "Total général", Number(grandTotal.toFixed(2))],
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [
    { wch: 2 },
    { wch: 26 },
    { wch: 16 },
    { wch: 22 },
    { wch: 20 },
    { wch: 22 },
    { wch: 14 },
  ];
  return ws;
}

export function buildDemoWorkbook(
  receipts: ExpenseReceiptFixture[],
  employeeName = "Nathalie",
): Blob {
  const groups = groupByTrip(receipts);
  const wb = XLSX.utils.book_new();
  const usedNames = new Set<string>();

  XLSX.utils.book_append_sheet(
    wb,
    buildSummarySheet(groups, employeeName),
    sanitizeSheetName("Synthèse", usedNames),
  );

  for (const g of groups) {
    XLSX.utils.book_append_sheet(
      wb,
      buildTripSheet(g.trip, g.receipts, employeeName),
      sanitizeSheetName(g.trip.sheetName, usedNames),
    );
  }

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
