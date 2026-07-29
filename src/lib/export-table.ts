"use client";

import * as XLSX from "xlsx";

/** One exportable column: how to label it and how to read its value off a row. */
export interface ExportColumn<T> {
  label: string;
  value: (row: T) => string | number | null | undefined;
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exports exactly the rows passed in — callers pass their already-filtered
 * list (e.g. the board's current search/stage/status/date-range selection),
 * so what downloads always matches what's on screen.
 */
export function exportRowsAsCsv<T>(rows: T[], columns: ExportColumn<T>[], filenameBase: string) {
  const lines = [columns.map((c) => csvCell(c.label)).join(",")];
  for (const row of rows) {
    lines.push(columns.map((c) => csvCell(c.value(row) ?? "")).join(","));
  }
  // Leading BOM so Excel opens the UTF-8 file with accented French text intact.
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `${filenameBase}.csv`);
}

export function exportRowsAsExcel<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filenameBase: string,
  sheetName = "Export",
) {
  const headers = columns.map((c) => c.label);
  const data = rows.map((row) => columns.map((c) => c.value(row) ?? ""));
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  ws["!cols"] = columns.map((c) => ({ wch: Math.max(12, Math.min(40, c.label.length + 4)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${filenameBase}.xlsx`);
}
