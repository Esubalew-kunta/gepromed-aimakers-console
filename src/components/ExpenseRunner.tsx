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
  "2202242138164.pdf (same ticket — try it with the one above)",
  "bus Venice Airport March 2026.pdf",
  "train Belluno Venice.pdf",
  "Strasbourg bus 03.2026.pdf",
  "Reservation_Vol.pdf",
  "Reservation_Hotel_1.pdf",
  "Reservation_Hotel_2.pdf (same stay — try it with the one above)",
  "Tampa.pdf",
  "FactureAirFrance26042026.pdf",
  "effia-Facture-13626376.pdf",
];

/**
 * Deduplicates and merges matched files before processing, per the PRD's
 * named edge cases: two files can be the exact same fiscal document (a
 * duplicate ticket), or a booking confirmation + its payment receipt for the
 * same stay (merge into one line, keep the actually-paid amount).
 */
function reconcileMatches(items: MatchedItem[]): { kept: MatchedItem[]; notes: LogLine[] } {
  const notes: LogLine[] = [];

  const seenIds = new Map<string, MatchedItem>();
  const afterIdDedup: MatchedItem[] = [];
  for (const item of items) {
    const existing = seenIds.get(item.fixture.id);
    if (existing) {
      notes.push({
        kind: "warn",
        line: `Duplicate detected: "${item.fileName}" is the same fiscal document as "${existing.fileName}" — counted once.`,
      });
    } else {
      seenIds.set(item.fixture.id, item);
      afterIdDedup.push(item);
    }
  }

  const byMergeGroup = new Map<string, MatchedItem[]>();
  const standalone: MatchedItem[] = [];
  for (const item of afterIdDedup) {
    const group = item.fixture.mergeGroup;
    if (!group) {
      standalone.push(item);
      continue;
    }
    const arr = byMergeGroup.get(group) ?? [];
    arr.push(item);
    byMergeGroup.set(group, arr);
  }

  const kept: MatchedItem[] = [...standalone];
  for (const group of byMergeGroup.values()) {
    const primary = group.find((g) => g.fixture.isMergePrimary) ?? group[0];
    kept.push(primary);
    if (primary.fixture.mergeNote) {
      notes.push({ kind: "warn", line: primary.fixture.mergeNote });
    }
  }

  return { kept, notes };
}

export function ExpenseRunner() {
  const [stage, setStage] = useState<Stage>("idle");
  const [matched, setMatched] = useState<MatchedItem[]>([]);
  const [unmatched, setUnmatched] = useState<string[]>([]);
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [minutesSaved, setMinutesSaved] = useState(0);
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, ExpenseCategory>>({});
  const [preparedBy, setPreparedBy] = useState("Nathalie");
  const [downloading, setDownloading] = useState(false);
  const timeouts = useRef<number[]>([]);
  const logBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      timeouts.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    const box = logBoxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [logLines]);

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

  const runProcessing = (items: MatchedItem[], preNotes: LogLine[], missed: string[]) => {
    setLogLines([]);
    setMinutesSaved(0);

    type Step = { delay: number; line: string; kind: LogKind; addMinutes?: number };
    const steps: Step[] = [];
    let t = 250;
    const gap = 420;

    preNotes.forEach((n) => {
      steps.push({ delay: t, ...n });
      t += gap;
    });

    for (const { fileName, fixture: r } of items) {
      steps.push({ delay: t, line: `Reading "${fileName}"…`, kind: "info" });
      t += gap;
      const lines = r.lineCount ?? 1;
      steps.push({
        delay: t,
        line:
          lines > 1
            ? `Found ${lines} line items: ${r.category} — ${formatOriginalAmount(r)} each (${r.vendor})`
            : `Found: ${r.category} — ${formatOriginalAmount(r)} (${r.vendor})`,
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
        line:
          lines > 1
            ? `Filed as ${lines} lines under "${r.category}", trip "${r.trip.label}" (sheet ${r.trip.sheetName})`
            : `Filed under "${r.category}", trip "${r.trip.label}" (sheet ${r.trip.sheetName})`,
        kind: "ok",
        addMinutes: r.minutesSaved,
      });
      t += gap;
      if (r.alert) {
        steps.push({ delay: t, line: `⚠ ${r.alert}`, kind: "warn" });
        t += gap;
      }
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
      line: `✔ Done — ${items.length} document${items.length === 1 ? "" : "s"} processed, ${missed.length} skipped.`,
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
    const rawMatched: MatchedItem[] = [];
    const newUnmatched: string[] = [];
    for (const f of files) {
      const fixture = matchReceipt(f.name);
      if (fixture) rawMatched.push({ fileName: f.name, fixture });
      else newUnmatched.push(f.name);
    }
    if (rawMatched.length === 0 && newUnmatched.length === 0) return;
    const { kept, notes } = reconcileMatches(rawMatched);
    setMatched(kept);
    setUnmatched(newUnmatched);
    setStage("processing");
    runProcessing(kept, notes, newUnmatched);
  };

  const effectiveReceipts: ExpenseReceiptFixture[] = matched.map(({ fixture }) => ({
    ...fixture,
    category: categoryOverrides[fixture.id] ?? fixture.category,
  }));

  const handleConfirm = async () => {
    setDownloading(true);
    try {
      const { buildDemoWorkbook, downloadBlob } = await import("@/lib/xlsx/buildDemoWorkbook");
      const blob = buildDemoWorkbook(effectiveReceipts, preparedBy.trim() || "Nathalie");
      downloadBlob(
        `notes-de-frais-demo-${(preparedBy.trim() || "nathalie").toLowerCase().replace(/\s+/g, "-")}.xlsx`,
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
              Try it with the real 11-file sample set
            </p>
            <p className="mt-1 text-xs text-ink-500">
              From the shared <code className="rounded bg-ink-100 px-1 py-0.5">/finance</code>{" "}
              folder — drop them all at once to see duplicates and merges get handled, or a
              few at a time:
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
          <div
            ref={logBoxRef}
            className="max-h-80 overflow-y-auto rounded-xl bg-ink-900 p-4 font-mono text-xs leading-relaxed lg:col-span-2"
          >
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
            {stage === "processing" ? (
              <p className="mt-1 text-xs text-ink-400">
                vs. reading, converting and typing each line by hand
              </p>
            ) : (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                <Icon name="check" className="h-4 w-4" /> Done
              </p>
            )}
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
              <span className="text-ink-500">Prepared by</span>
              <input
                className="input w-40"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
              />
            </label>
          </div>

          {groupByTrip(effectiveReceipts).map((g) => (
            <div key={g.trip.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink-900">{g.trip.label}</p>
                  <p className="text-xs text-ink-400">
                    {g.trip.lieu} · {g.trip.period} · sheet &quot;{g.trip.sheetName}&quot;
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    Traveler:{" "}
                    <span className="font-medium text-ink-700">{g.trip.traveler}</span>
                    {g.trip.travelerSource === "deduced" ? (
                      <span className="ml-1 text-ink-400">(deduced from the batch)</span>
                    ) : null}
                    {g.trip.travelerSource === "unresolved" ? (
                      <span className="ml-1 text-amber-600">(needs Nathalie to confirm)</span>
                    ) : null}
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
                        <td className="py-1.5 pr-2 text-ink-700">
                          {r.vendor}
                          {r.alert ? (
                            <span
                              title={r.alert}
                              className="ml-1.5 inline-block rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700"
                            >
                              alert
                            </span>
                          ) : null}
                        </td>
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
