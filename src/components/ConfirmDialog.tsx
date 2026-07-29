"use client";

import { useEffect } from "react";
import { Icon } from "./Icon";

/**
 * Premium confirmation modal — replaces the browser's native `confirm()` for
 * destructive actions (delete trainee / engineering request) so the prompt
 * matches the app's own design instead of an unstyled OS dialog. Purely
 * presentational: the caller owns the open/target state and wires
 * onConfirm/onCancel to its own logic.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/45 p-4 backdrop-blur-[2px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-ink-100 bg-white p-6 text-center shadow-2xl ring-1 ring-black/5"
      >
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-500">
          <Icon name="trash" className="h-5 w-5" />
        </div>
        <h3 className="text-base font-bold text-ink-900">{title}</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">{message}</p>
        <div className="mt-6 flex gap-2.5">
          <button onClick={onCancel} className="btn-ghost flex-1 !py-2.5 !text-sm">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
