"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { exportRowsAsCsv, exportRowsAsExcel, type ExportColumn } from "@/lib/export-table";

/**
 * Small "Export ▾" dropdown (CSV / Excel) for a board's table. `rows` must be
 * the CALLER's already-filtered list — this component never re-filters, so
 * whatever the user currently has selected in search/stage/status/date
 * filters is exactly what downloads. Mirrors ExportMenu's dropdown pattern,
 * with a premium finish: soft shadow, brand-tinted icon chips, subtle scale
 * transition on open.
 */
export function TableExportMenu<T>({
  rows,
  columns,
  filenameBase,
  sheetName,
  labelFr,
}: {
  rows: T[];
  columns: ExportColumn<T>[];
  filenameBase: string;
  sheetName?: string;
  /** Small label shown next to the row count, e.g. "trainee(s)" / "demande(s)". */
  labelFr: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const disabled = rows.length === 0;

  const item =
    "flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-medium text-ink-700 transition-colors hover:bg-brand-50/60";
  const chip =
    "grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-50 text-ink-500 transition-colors group-hover:bg-brand-100 group-hover:text-brand-700";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        title={disabled ? "Aucune ligne à exporter avec ces filtres" : undefined}
        className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
          disabled
            ? "cursor-not-allowed border-ink-100 bg-ink-50 text-ink-300"
            : open
              ? "border-brand-300 bg-brand-50 text-brand-700 shadow-sm"
              : "border-ink-200 bg-white text-ink-600 hover:border-brand-200 hover:bg-brand-50/40 hover:text-brand-700"
        }`}
      >
        <Icon name="database" className="h-4 w-4" />
        Exporter
        <span className={disabled ? "text-ink-300" : "text-ink-400"}>
          ({rows.length} {labelFr})
        </span>
        <span
          className={`text-[10px] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-60 origin-top-right overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-xl ring-1 ring-black/5">
          <div className="border-b border-ink-100 px-3.5 py-2.5">
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-ink-400">
              Exporter la sélection filtrée
            </p>
          </div>
          <button
            className={`${item} group`}
            onClick={() => {
              exportRowsAsCsv(rows, columns, filenameBase);
              setOpen(false);
            }}
          >
            <span className={chip}>
              <Icon name="copy" className="h-4 w-4" />
            </span>
            <span>
              <span className="block">CSV</span>
              <span className="block text-[11px] font-normal text-ink-400">.csv &middot; tableur universel</span>
            </span>
          </button>
          <button
            className={`${item} group`}
            onClick={() => {
              exportRowsAsExcel(rows, columns, filenameBase, sheetName);
              setOpen(false);
            }}
          >
            <span className={chip}>
              <Icon name="clipboard-check" className="h-4 w-4" />
            </span>
            <span>
              <span className="block">Excel</span>
              <span className="block text-[11px] font-normal text-ink-400">.xlsx &middot; Microsoft Excel</span>
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
