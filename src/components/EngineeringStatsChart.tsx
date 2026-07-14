"use client";

import { useMemo } from "react";
import type { EngineeringRequest } from "@/lib/engineering-data";
import { type PipelineDef, type Lang, stageLabelOf } from "@/lib/pipeline/core";
import { useT, useLang } from "@/lib/i18n";
import { engStatus } from "./EngineeringKpiRow";

const BAR_COLORS = [
  "bg-brand-500",
  "bg-teal-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-rose-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-indigo-500",
];

const STATUS_COLORS: Record<string, string> = {
  active: "#f59e0b",
  done: "#10b981",
  exited: "#f43f5e",
};

function Bar({ label, value, max, colorClass }: { label: string; value: number; max: number; colorClass: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="truncate text-ink-600">{label}</span>
        <span className="font-semibold text-ink-900">{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-ink-100">
        <div className={`h-2 rounded-full ${colorClass} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Donut({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 15.9155;
  let offset = 0;
  const segments = data.map((d) => {
    const pct = total === 0 ? 0 : (d.value / total) * 100;
    const seg = { ...d, pct, offset };
    offset += pct;
    return seg;
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 42 42" className="h-24 w-24 shrink-0 -rotate-90">
        <circle cx="21" cy="21" r={r} fill="transparent" stroke="#eef0f4" strokeWidth="7" />
        {segments.map((s, i) =>
          s.pct > 0 ? (
            <circle
              key={i}
              cx="21"
              cy="21"
              r={r}
              fill="transparent"
              stroke={s.color}
              strokeWidth="7"
              strokeDasharray={`${s.pct} ${100 - s.pct}`}
              strokeDashoffset={-s.offset}
            />
          ) : null,
        )}
      </svg>
      <div className="space-y-1.5 text-xs">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="text-ink-600">{s.label}</span>
            <span className="font-semibold text-ink-900">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ data }: { data: { label: string; value: number }[] }) {
  const w = 240;
  const h = 90;
  const padX = 8;
  const padY = 10;
  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? (w - padX * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = padX + i * stepX;
    const y = h - padY - (d.value / max) * (h - padY * 2);
    return { x, y, ...d };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${path} L${points[points.length - 1]?.x ?? padX},${h - padY} L${padX},${h - padY} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
      <path d={area} fill="url(#engTrendFill)" opacity={0.5} />
      <path d={path} fill="none" stroke="#5b6ee8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#5b6ee8" />
      ))}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={h} fontSize="7" textAnchor="middle" fill="#8a8f9c">
          {p.label}
        </text>
      ))}
      <defs>
        <linearGradient id="engTrendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5b6ee8" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#5b6ee8" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Stats panel for the Engineering board — by stage (bars), by status (donut),
 * and requests by month (line). Reacts to the currently filtered `rows` of the
 * active kind. Dependency-free inline SVG, consistent with TraineeStatsChart. */
export function EngineeringStatsChart({
  rows,
  def,
}: {
  rows: EngineeringRequest[];
  def: PipelineDef;
}) {
  const t = useT();
  const { lang } = useLang();

  const byStage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      const label = stageLabelOf(def, r.variant ?? def.defaultVariantKey, r.stage, lang);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [rows, def, lang]);

  const byStatus = useMemo(() => {
    const active = rows.filter((r) => engStatus(r) === "active").length;
    const done = rows.filter((r) => engStatus(r) === "done").length;
    const exited = rows.filter((r) => engStatus(r) === "exited").length;
    return [
      { label: t("engineering.status.active"), value: active, color: STATUS_COLORS.active },
      { label: t("engineering.status.done"), value: done, color: STATUS_COLORS.done },
      { label: t("engineering.status.exited"), value: exited, color: STATUS_COLORS.exited },
    ];
  }, [rows, t]);

  const byMonth = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { month: "short" }),
      });
    }
    const counts = new Map(months.map((m) => [m.key, 0]));
    for (const r of rows) {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return months.map((m) => ({ label: m.label, value: counts.get(m.key) ?? 0 }));
  }, [rows, lang]);

  const stageMax = Math.max(1, ...byStage.map((d) => d.value));

  return (
    <div className="card mb-4 p-5">
      <p className="mb-4 text-xs font-bold uppercase tracking-wide text-ink-400">
        {t("engineering.stats.title")}
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-ink-100 p-4">
          <p className="mb-3 text-sm font-semibold text-ink-700">{t("engineering.stats.byStage")}</p>
          <div className="space-y-2.5">
            {byStage.map((d, i) => (
              <Bar key={d.label} label={d.label} value={d.value} max={stageMax} colorClass={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-ink-100 p-4">
          <p className="mb-3 text-sm font-semibold text-ink-700">{t("engineering.stats.byStatus")}</p>
          <Donut data={byStatus} />
        </div>
        <div className="rounded-xl border border-ink-100 p-4">
          <p className="mb-3 text-sm font-semibold text-ink-700">{t("engineering.stats.byMonth")}</p>
          <LineChart data={byMonth} />
        </div>
      </div>
    </div>
  );
}
