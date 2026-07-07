"use client";

/**
 * Builds a downloadable .xlsx entirely in the browser — no server call — that
 * mirrors the exact structure of Matrice LM_0226_rembt Frais.xlsx (per the
 * Gepromed PRD's technical appendix): title at G2, header block at B5/C5
 * (Nom), B7/C7 (Service), B9/C9 (Période), L5/P5/L7/P7 labels, expense table
 * header on row 13, data from row 14, and live SUM formulas — not pre-baked
 * numbers — so it behaves like the file Nathalie already uses.
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

const TOTAL_COL = "S"; // matches COLUMNS[17] = "Total"
const FIRST_CATEGORY_COL = "F"; // Billet d'avion
const LAST_CATEGORY_COL = "P"; // Divers
const HEADER_ROW = 13; // matches the real Matrice sheet exactly
const FIRST_DATA_ROW = 14;

const colLetter = (index0: number) => String.fromCharCode(66 + index0); // 0 -> "B"

function receiptRow(r: ExpenseReceiptFixture): (string | number)[] {
  const eur = eurAmountOf(r);
  const cell = (cat: string) => (r.category === cat ? eur : "");
  return [
    r.invoiceDateLabel,
    r.trip.etude,
    r.objet || r.vendor,
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
    "", // Total — written as a live formula below, not a value
  ];
}

function sanitizeSheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[\\/?*[\]:]/g, "").slice(0, 31) || "Sheet";
  let candidate = base;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base.slice(0, 28)} (${n++})`;
  }
  used.add(candidate);
  return candidate;
}

function travelerLabelOf(trip: ExpenseReceiptFixture["trip"]): string {
  if (trip.travelerSource === "deduced") return `${trip.traveler} (déduit du lot)`;
  if (trip.travelerSource === "unresolved") return `${trip.traveler} — à préciser par Nathalie`;
  return trip.traveler;
}

function buildTripSheet(
  trip: ExpenseReceiptFixture["trip"],
  receipts: ExpenseReceiptFixture[],
): XLSX.WorkSheet {
  const dataRows = receipts.map(receiptRow);
  const lastDataRow = FIRST_DATA_ROW + dataRows.length - 1;
  const totalRow = lastDataRow + 1;

  const rows: (string | number)[][] = Array.from({ length: totalRow }, () => []);
  const set = (rowNum: number, letter: string, value: string | number) => {
    rows[rowNum - 1][letter.charCodeAt(0) - 65] = value;
  };

  set(2, "G", "Rapport de dépenses de déplacement");
  set(5, "B", "Nom");
  set(5, "C", travelerLabelOf(trip));
  set(5, "L", "Autorisé par");
  set(5, "P", "Remboursement de frais par kilomètre");
  set(7, "B", "Service");
  set(7, "C", "GEPROMED");
  set(7, "L", "Paie de Remboursement");
  set(7, "P", "Remboursement total dû");
  set(9, "B", "Période");
  set(9, "C", trip.period);
  COLUMNS.forEach((label, i) => set(HEADER_ROW, colLetter(i), label));
  dataRows.forEach((row, i) => {
    row.forEach((value, j) => {
      if (value !== "") set(FIRST_DATA_ROW + i, colLetter(j), value);
    });
  });
  set(totalRow, "B", "Total");

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Per-row Total = SUM(Billet d'avion..Divers), live formula (matches the real S column formula).
  for (let row = FIRST_DATA_ROW; row <= lastDataRow; row++) {
    ws[`${TOTAL_COL}${row}`] = {
      t: "n",
      f: `SUM(${FIRST_CATEGORY_COL}${row}:${LAST_CATEGORY_COL}${row})`,
    };
  }

  // Bottom Total row: one SUM per category column, plus the grand total.
  const summedCols = [FIRST_CATEGORY_COL, "G", "H", "I", "J", "K", "L", "M", "P", TOTAL_COL];
  for (const col of summedCols) {
    ws[`${col}${totalRow}`] = {
      t: "n",
      f: `SUM(${col}${FIRST_DATA_ROW}:${col}${lastDataRow})`,
    };
  }

  // Q7 "Remboursement total dû" — matches the real file's =Dépenses[[#Totals],[Total]].
  ws["Q7"] = { t: "n", f: `${TOTAL_COL}${totalRow}` };

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
  alerts: string[],
): XLSX.WorkSheet {
  const grandTotal = groups.reduce((sum, g) => sum + g.totalEur, 0);
  const aoa: (string | number)[][] = [
    ["", "Synthèse — notes de frais générées automatiquement"],
    ["", "Préparé par", employeeName],
    [""],
    ["", "Voyage / trip", "Feuille", "Voyageur", "Lieu", "Période", "Justificatifs", "Total (EUR)"],
    ...groups.map((g) => [
      "",
      g.trip.label,
      g.trip.sheetName,
      travelerLabelOf(g.trip),
      g.trip.lieu,
      g.trip.period,
      g.receipts.length,
      Number(g.totalEur.toFixed(2)),
    ]),
    ["", "", "", "", "", "", "Total général", Number(grandTotal.toFixed(2))],
  ];
  if (alerts.length > 0) {
    aoa.push([""]);
    aoa.push(["", "Alertes à vérifier"]);
    alerts.forEach((a) => aoa.push(["", a]));
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [
    { wch: 2 },
    { wch: 26 },
    { wch: 16 },
    { wch: 20 },
    { wch: 22 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
  ];
  return ws;
}

export function buildDemoWorkbook(
  receipts: ExpenseReceiptFixture[],
  employeeName = "Nathalie",
): Blob {
  const groups = groupByTrip(receipts);
  const alerts = receipts.flatMap((r) =>
    [r.alert, r.mergeNote].filter((x): x is string => Boolean(x)),
  );
  const wb = XLSX.utils.book_new();
  const usedNames = new Set<string>();

  XLSX.utils.book_append_sheet(
    wb,
    buildSummarySheet(groups, employeeName, alerts),
    sanitizeSheetName("Synthèse", usedNames),
  );

  for (const g of groups) {
    XLSX.utils.book_append_sheet(
      wb,
      buildTripSheet(g.trip, g.receipts),
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
