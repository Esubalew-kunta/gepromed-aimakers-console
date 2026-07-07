"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { ExpenseUploader } from "./ExpenseUploader";
import {
  type ExpenseCategory,
  type ExpenseReceiptFixture,
  EXPENSE_CATEGORIES,
  matchReceipt,
  eurAmountOf,
  manualFormulaOf,
  formatOriginalAmount,
  formatEUR,
  groupByTrip,
} from "@/lib/seed/expenses";

type Stage = "idle" | "processing" | "review" | "done";
type LogKind = "info" | "ok" | "warn";
interface LogLine {
  line: string;
  kind: LogKind;
}
interface MatchedItem {
  fileName: string;
  fixture: ExpenseReceiptFixture;
}

const KIND_COLORS: Record<LogKind, string> = {
  info: "text-ink-400",
  ok: "text-emerald-400",
  warn: "text-amber-400",
};

const DEMO_FILES = [
  "Flight tickets Venice-Strasbourg March 2026.pdf",
  "bus Venice Airport March 2026.pdf",
  "Strasbourg bus 03.2026.pdf",
  "Reservation_Hotel_1.pdf",
  "Tampa.pdf",
  "effia-Facture-13626376.pdf",
];

export function ExpenseRunner() {
  const [stage, setStage] = useState<Stage>("idle");
  const [matched, setMatched] = useState<MatchedItem[]>([]);
  const [unmatched, setUnmatched] = useState<string[]>([]);
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [minutesSaved, setMinutesSaved] = useState(0);
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, ExpenseCategory>>({});
  const [employeeName, setEmployeeName] = useState("Nathalie");
  const [downloading, setDownloading] = useState(false);
  const timeouts = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timeouts.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const reset = () => {
    timeouts.current.forEach((id) => window.clearTimeout(id));
    timeouts.current = [];
    setStage("idle");
    setMatched([]);
    setUnmatched([]);
    setLogLines([]);
    setMinutesSaved(0);
    setCategoryOverrides({});
    setDownloading(false);
  };

  const runProcessing = (items: MatchedItem[], missed: string[]) => {
    setLogLines([]);
    setMinutesSaved(0);

    type Step = { delay: number; line: string; kind: LogKind; addMinutes?: number };
    const steps: Step[] = [];
    let t = 250;
    const gap = 420;

    for (const { fileName, fixture: r } of items) {
      steps.push({ delay: t, line: `Reading "${fileName}"…`, kind: "info" });
      t += gap;
      steps.push({
        delay: t,
        line: `Found: ${r.category} — ${formatOriginalAmount(r)} (${r.vendor})`,
        kind: "ok",
      });
      t += gap;
      if (r.fxRate) {
        const formula = manualFormulaOf(r);
        steps.push({
          delay: t,
          line: `Converting at the ${r.fxRateSource} for ${r.invoiceDateLabel} → ${formatEUR(eurAmountOf(r))}`,
          kind: "ok",
        });
        t += gap;
        steps.push({
          delay: t,
          line: `You would have typed "${formula}" by hand — done automatically instead`,
          kind: "warn",
        });
        t += gap;
      }
      steps.push({
        delay: t,
        line: `Filed under "${r.category}", trip "${r.trip.label}" (sheet ${r.trip.sheetName})`,
        kind: "ok",
        addMinutes: r.minutesSaved,
      });
      t += gap;
    }
    for (const name of missed) {
      steps.push({
        delay: t,
        line: `"${name}" is not part of this demo set — in production this would be read live.`,
        kind: "warn",
      });
      t += gap;
    }
    steps.push({
      delay: t,
      line: `✔ Done — ${items.length} receipt${items.length === 1 ? "" : "s"} processed, ${missed.length} skipped.`,
      kind: "info",
    });
    t += 500;

    steps.forEach((s) => {
      const id = window.setTimeout(() => {
        setLogLines((prev) => [...prev, { line: s.line, kind: s.kind }]);
        if (s.addMinutes) setMinutesSaved((m) => m + (s.addMinutes ?? 0));
      }, s.delay);
      timeouts.current.push(id);
    });
    const finalId = window.setTimeout(() => setStage("review"), t + 300);
    timeouts.current.push(finalId);
  };

  const handleFiles = (files: File[]) => {
    const newMatched: MatchedItem[] = [];
    const newUnmatched: string[] = [];
    for (const f of files) {
      const fixture = matchReceipt(f.name);
      if (fixture) newMatched.push({ fileName: f.name, fixture });
      else newUnmatched.push(f.name);
    }
    if (newMatched.length === 0 && newUnmatched.length === 0) return;
    setMatched(newMatched);
    setUnmatched(newUnmatched);
    setStage("processing");
    runProcessing(newMatched, newUnmatched);
  };

  const effectiveReceipts: ExpenseReceiptFixture[] = matched.map(({ fixture }) => ({
    ...fixture,
    category: categoryOverrides[fixture.id] ?? fixture.category,
  }));

  const handleConfirm = async () => {
    setDownloading(true);
    try {
      const { buildDemoWorkbook, downloadBlob } = await import("@/lib/xlsx/buildDemoWorkbook");
      const blob = buildDemoWorkbook(effectiveReceipts, employeeName.trim() || "Nathalie");
      downloadBlob(
        `notes-de-frais-demo-${(employeeName.trim() || "nathalie").toLowerCase().replace(/\s+/g, "-")}.xlsx`,
        blob,
      );
      setStage("done");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {stage === "idle" ? (
        <>
          <ExpenseUploader onFiles={handleFiles} />
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Try it with the real sample files
            </p>
            <p className="mt-1 text-xs text-ink-500">
              From the shared <code className="rounded bg-ink-100 px-1 py-0.5">/finance</code>{" "}
              folder, drop in:
            </p>
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
              {DEMO_FILES.map((name) => (
                <li key={name} className="flex items-center gap-2 text-xs text-ink-600">
                  <Icon name="clipboard-check" className="h-3.5 w-3.5 text-ink-300" />
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}

      {stage === "processing" || stage === "review" || stage === "done" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl bg-ink-900 p-4 font-mono text-xs leading-relaxed">
            <p className="mb-2 text-ink-500">$ process expense batch</p>
            {logLines.map((l, i) => (
              <div key={i} className={KIND_COLORS[l.kind]}>
                {l.line}
              </div>
            ))}
            {stage === "processing" ? (
              <span className="mt-1 inline-block h-3 w-2 animate-pulse bg-ink-500" />
            ) : null}
          </div>
          <div className="card flex flex-col justify-center p-5">
            <p className="text-sm text-ink-500">Time saved so far</p>
            <p className="mt-1 text-3xl font-bold text-ink-900">{minutesSaved} min</p>
            <p className="mt-1 text-xs text-ink-400">
              vs. reading, converting and typing each line by hand
            </p>
          </div>
        </div>
      ) : null}

      {stage === "review" ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-900">
                Review before anything is saved
              </p>
              <p className="text-xs text-ink-500">
                Adjust a category if needed, then confirm.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-ink-500">Employee</span>
              <input
                className="input w-40"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
              />
            </label>
          </div>

          {groupByTrip(effectiveReceipts).map((g) => (
            <div key={g.trip.id} className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink-900">{g.trip.label}</p>
                  <p className="text-xs text-ink-400">
                    {g.trip.lieu} · {g.trip.period} · sheet &quot;{g.trip.sheetName}&quot;
                  </p>
                </div>
                <p className="text-lg font-bold text-ink-900">{formatEUR(g.totalEur)}</p>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-ink-400">
                      <th className="py-1 pr-2">Date</th>
                      <th className="py-1 pr-2">Description</th>
                      <th className="py-1 pr-2">Category</th>
                      <th className="py-1 pr-2">Original</th>
                      <th className="py-1 pr-0 text-right">EUR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.receipts.map((r) => (
                      <tr key={r.id} className="border-t border-ink-100">
                        <td className="whitespace-nowrap py-1.5 pr-2 text-ink-600">
                          {r.invoiceDateLabel}
                        </td>
                        <td className="py-1.5 pr-2 text-ink-700">{r.vendor}</td>
                        <td className="py-1.5 pr-2">
                          <select
                            className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs"
                            value={categoryOverrides[r.id] ?? r.category}
                            onChange={(e) =>
                              setCategoryOverrides((prev) => ({
                                ...prev,
                                [r.id]: e.target.value as ExpenseCategory,
                              }))
                            }
                          >
                            {EXPENSE_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="whitespace-nowrap py-1.5 pr-2 text-ink-500">
                          {r.originalCurrency !== "EUR" ? formatOriginalAmount(r) : "—"}
                        </td>
                        <td className="whitespace-nowrap py-1.5 pr-0 text-right font-medium text-ink-900">
                          {formatEUR(eurAmountOf(r))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {unmatched.length > 0 ? (
            <div className="card border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {unmatched.length} file{unmatched.length === 1 ? "" : "s"} skipped (not part of
              this demo set): {unmatched.join(", ")}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <button className="btn-ghost" onClick={reset}>
              Start over
            </button>
            <button className="btn-primary" onClick={handleConfirm} disabled={downloading}>
              {downloading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Building workbook…
                </>
              ) : (
                <>
                  <Icon name="check" className="h-4 w-4" /> Confirm &amp; save to workbook
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}

      {stage === "done" ? (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Icon name="check" className="h-6 w-6" />
          </div>
          <p className="text-lg font-bold text-ink-900">Workbook ready</p>
          <p className="max-w-sm text-sm text-ink-500">
            The .xlsx downloaded to your computer, laid out exactly like the real
            template — {minutesSaved} minutes of manual entry done in seconds. Open it
            in Excel to check.
          </p>
          <button className="btn-ghost mt-2" onClick={reset}>
            Start a new batch
          </button>
        </div>
      ) : null}
    </div>
  );
}
