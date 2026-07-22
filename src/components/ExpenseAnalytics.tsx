"use client";

import { CATEGORY_COLUMN, type CategoryKey } from "@/lib/expenses/types";

// Minimal shape this panel needs — structurally compatible with the preview rows
// returned by /api/expenses/preview.
type Row = {
  date: string | null;
  category: string | null;
  amountEUR: number | null;
  sourceFile: string | null;
};

const eur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const eurShort = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k€` : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + "€";
const categoryLabel = (k: string | null) =>
  k && k in CATEGORY_COLUMN ? CATEGORY_COLUMN[k as CategoryKey].label.replace(/\s*\n\s*/g, " ") : k || "Sans catégorie";

const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
};

/**
 * "Analyse des dépenses" — a compact, dependency-free analytics panel computed
 * client-side from the committed expenses (mirror of the shared Google Sheet).
 * Every chart is a single-series magnitude/time view, so it uses ONE brand hue
 * (never a per-bar palette — that would colour by rank). Values are labelled in
 * ink tokens beside the bars, so there are no on-fill contrast issues.
 */
export function ExpenseAnalytics({ rows, embedded = false }: { rows: Row[]; embedded?: boolean }) {
  const valid = rows.filter((r) => (r.amountEUR ?? 0) > 0);
  if (valid.length === 0) return null;

  const total = valid.reduce((s, r) => s + (r.amountEUR ?? 0), 0);

  // 1) By category (high → low)
  const catMap = new Map<string, number>();
  for (const r of valid) {
    const k = r.category ?? "misc";
    catMap.set(k, (catMap.get(k) ?? 0) + (r.amountEUR ?? 0));
  }
  const cats = [...catMap.entries()]
    .map(([key, amount]) => ({ key, amount, label: categoryLabel(key) }))
    .sort((a, b) => b.amount - a.amount);
  const catMax = cats[0]?.amount ?? 0;

  // 2) Top 5 largest individual expenses
  const top = [...valid].sort((a, b) => (b.amountEUR ?? 0) - (a.amountEUR ?? 0)).slice(0, 5);
  const topMax = top[0]?.amountEUR ?? 0;

  // 3) Monthly trend (chronological, last 12 months present)
  const monthMap = new Map<string, number>();
  for (const r of valid) {
    if (!r.date) continue;
    const ym = r.date.slice(0, 7); // yyyy-mm
    if (!/^\d{4}-\d{2}$/.test(ym)) continue;
    monthMap.set(ym, (monthMap.get(ym) ?? 0) + (r.amountEUR ?? 0));
  }
  const months = [...monthMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([ym, amount]) => ({ ym, amount, label: monthLabel(ym) }));
  const monthMax = Math.max(1, ...months.map((m) => m.amount));

  return (
    <div className={embedded ? "" : "rounded-2xl border border-ink-200 bg-white p-5"}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {embedded ? (
          <div className="text-xs text-ink-500">Récapitulatif des dépenses enregistrées</div>
        ) : (
          <div className="text-sm font-semibold text-ink-900">Analyse des dépenses</div>
        )}
        <div className="text-xs text-ink-500">
          {valid.length} dépense(s) · <span className="font-semibold text-ink-900">{eur(total)}</span> au total
        </div>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        {/* 1) Dépenses par catégorie */}
        <section>
          <div className="text-xs font-semibold text-ink-700">Dépenses par catégorie</div>
          <div className="mt-3 space-y-2.5">
            {cats.map((c) => {
              const pct = total > 0 ? Math.round((c.amount / total) * 100) : 0;
              return (
                <div key={c.key}>
                  <div className="flex items-baseline justify-between gap-2 text-[11px]">
                    <span className="truncate text-ink-600" title={c.label}>{c.label}</span>
                    <span className="shrink-0 tabular-nums font-medium text-ink-900">{eur(c.amount)} · {pct}%</span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${Math.max(3, catMax > 0 ? (c.amount / catMax) * 100 : 0)}%` }}
                      title={`${c.label} : ${eur(c.amount)} (${pct}%)`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2) Top 5 plus grosses dépenses */}
        <section>
          <div className="text-xs font-semibold text-ink-700">Top 5 des plus grosses dépenses</div>
          <div className="mt-3 space-y-2.5">
            {top.map((r, i) => {
              const amount = r.amountEUR ?? 0;
              const name = r.sourceFile || "—";
              return (
                <div key={`${name}-${i}`}>
                  <div className="flex items-baseline justify-between gap-2 text-[11px]">
                    <span className="truncate text-ink-600" title={name}>
                      {i + 1}. {name}
                    </span>
                    <span className="shrink-0 tabular-nums font-medium text-ink-900">{eur(amount)}</span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${Math.max(3, topMax > 0 ? (amount / topMax) * 100 : 0)}%` }}
                      title={`${name} : ${eur(amount)}${r.date ? ` (${r.date})` : ""}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3) Évolution mensuelle */}
        <section>
          <div className="text-xs font-semibold text-ink-700">Évolution mensuelle</div>
          {months.length === 0 ? (
            <p className="mt-3 text-xs text-ink-400">Dates non renseignées.</p>
          ) : (
            <div className="mt-3 flex h-40 items-end gap-1.5">
              {months.map((m) => (
                <div key={m.ym} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <div className="text-[9px] tabular-nums text-ink-500">{eurShort(m.amount)}</div>
                  <div
                    className="w-full rounded-t bg-brand-500"
                    style={{ height: `${Math.max(4, (m.amount / monthMax) * 100)}%` }}
                    title={`${m.label} : ${eur(m.amount)}`}
                  />
                  <div className="w-full truncate text-center text-[9px] text-ink-500" title={m.label}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
