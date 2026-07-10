"use client";

import { useRef, useState } from "react";
import { Icon } from "./Icon";

export function ExpenseUploader({
  onFiles,
  disabled = false,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    onFiles(Array.from(list));
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
        disabled
          ? "cursor-not-allowed border-ink-100 bg-ink-50 opacity-60"
          : dragging
            ? "cursor-pointer border-brand-400 bg-brand-50"
            : "cursor-pointer border-ink-200 bg-white hover:border-brand-300 hover:bg-brand-50/40"
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon name="clipboard-check" className="h-6 w-6" />
      </div>
      <p className="mt-3 text-sm font-semibold text-ink-900">
        Drag receipts in, or click to browse
      </p>
      <p className="mt-1 max-w-sm text-xs text-ink-400">
        Invoices, tickets, hotel confirmations, taxi and meal receipts, drop as
        many as you have for this batch.
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="application/pdf,image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
