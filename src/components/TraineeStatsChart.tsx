"use client";

import { useMemo } from "react";
import { type Lead, normalizeParcours, stageLabel } from "@/lib/leads-shared";
import { useT } from "@/lib/i18n";

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

const HEX_COLORS = [
  "#5b6ee8", // brand
  "#14b8a6", // teal
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#0ea5e9", // sky
  "#f43f5e", // rose
  "#10b981", // emerald
  "#f97316", // orange
];

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

/** Two-slice donut for part-of-whole questions (e.g. self vs. sponsored funding).
 * Plain inline SVG — no charting library needed for two segments. */
function Donut({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 15.9155; // circumference = 100 when using this radius, so % maps directly to dasharray
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

/** Simple line chart for a trend over time — a shape bars can't communicate
 * as clearly as a line. Plain inline SVG, no charting library. */
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
      <path d={area} fill="url(#trendFill)" opacity={0.5} />
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
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5b6ee8" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#5b6ee8" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Stats panel for the trainee summary subsection: breakdown by status (bars —
 * many categories, ranked comparison), by funding (donut — 2-slice
 * part-of-whole), top courses (bars — ranked comparison), and registrations by
 * month (line — trend over time). Reacts to whatever `leads` subset is passed
 * in (e.g. the currently filtered set). */
export function TraineeStatsChart({ leads }: { leads: Lead[] }) {
  const t = useT();

  const byStatus = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of leads) {
      const parcours = normalizeParcours(l);
      const label = stageLabel(parcours, l.stage);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts, ([label, value]) => ({ label, value })).sort(
      (a, b) => b.value - a.value,
    );
  }, [leads]);

  // Three real funding states, not two: HelpMeSee trainees are foundation-
  // referred (their own "From €X" pricing rule, never plain self-funded),
  // so they get their own slice instead of silently falling into
  // "self-funded" just because their `funding` column isn't "sponsored".
  const byFunding = useMemo(() => {
    let helpmesee = 0;
    let self = 0;
    let sponsored = 0;
    for (const l of leads) {
      if (normalizeParcours(l) === "helpmesee") helpmesee++;
      else if (l.funding === "sponsored") sponsored++;
      else self++;
    }
    return [
      { label: t("traineeSummary.fundingSelf"), value: self, color: HEX_COLORS[0] },
      { label: t("traineeSummary.fundingSponsored"), value: sponsored, color: HEX_COLORS[2] },
      { label: t("traineeSummary.fundingHelpMeSee"), value: helpmesee, color: HEX_COLORS[1] },
    ];
  }, [leads, t]);

  const topCourses = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of leads) {
      const name = l.trainings?.title.fr ?? l.training_title_snapshot;
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return Array.from(counts, ([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [leads]);

  // Registration trend — last 6 calendar months, oldest first (chronological,
  // not sorted by value like the ranked panels above).
  const byMonth = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString("fr-FR", { month: "short" }),
      });
    }
    const counts = new Map(months.map((m) => [m.key, 0]));
    for (const l of leads) {
      const d = new Date(l.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return months.map((m) => ({ label: m.label, value: counts.get(m.key) ?? 0 }));
  }, [leads]);

  const statusMax = Math.max(1, ...byStatus.map((d) => d.value));
  const courseMax = Math.max(1, ...topCourses.map((d) => d.value));

  return (
    <div className="card mb-4 p-5">
      <p className="mb-4 text-xs font-bold uppercase tracking-wide text-ink-400">
        {t("traineeStats.title")}
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-ink-100 p-4">
          <p className="mb-3 text-sm font-semibold text-ink-700">{t("traineeStats.byStatus")}</p>
          <div className="space-y-2.5">
            {byStatus.map((d, i) => (
              <Bar key={d.label} label={d.label} value={d.value} max={statusMax} colorClass={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-ink-100 p-4">
          <p className="mb-3 text-sm font-semibold text-ink-700">{t("traineeStats.byFunding")}</p>
          <Donut data={byFunding} />
        </div>
        <div className="rounded-xl border border-ink-100 p-4">
          <p className="mb-3 text-sm font-semibold text-ink-700">{t("traineeStats.topCourses")}</p>
          <div className="space-y-2.5">
            {topCourses.map((d, i) => (
              <Bar key={d.label} label={d.label} value={d.value} max={courseMax} colorClass={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-ink-100 p-4">
          <p className="mb-3 text-sm font-semibold text-ink-700">{t("traineeStats.byMonth")}</p>
          <LineChart data={byMonth} />
        </div>
      </div>
    </div>
  );
}
