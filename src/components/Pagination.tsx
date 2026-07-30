"use client";

import { Icon } from "./Icon";
import { useT } from "@/lib/i18n";

const PAGE_SIZES = [10, 25, 50, 100];

export function Pagination({
  page,
  pageCount,
  pageSize,
  total,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const t = useT();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/40 px-5 py-3">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <span>{t("pagination.rowsPerPage")}</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs font-medium text-ink-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-ink-400">
          {total === 0
            ? t("pagination.showing", { from: 0, to: 0, total: 0 })
            : t("pagination.showing", { from: startIndex + 1, to: endIndex, total })}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label={t("pagination.prev")}
            title={t("pagination.prev")}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-500 transition hover:bg-ink-50 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
          >
            <Icon name="chevron-left" className="h-4 w-4" />
          </button>
          <span className="min-w-[6.5rem] text-center text-xs font-medium text-ink-600">
            {t("pagination.page", { page, pages: pageCount })}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
            aria-label={t("pagination.next")}
            title={t("pagination.next")}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-500 transition hover:bg-ink-50 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
          >
            <Icon name="chevron-right" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
