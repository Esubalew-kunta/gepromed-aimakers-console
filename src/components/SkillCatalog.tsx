"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "./Icon";

export interface SkillCardData {
  id: string;
  name: string;
  summary: string;
  category: string;
  icon: string;
  tags: string[];
  owner: string;
  status: string;
  runsThisMonth: number;
  avgMinutesSaved: number;
}

const STATUS_STYLES: Record<string, string> = {
  Live: "bg-emerald-100 text-emerald-700",
  Beta: "bg-amber-100 text-amber-700",
  Planned: "bg-ink-100 text-ink-600",
};

export function SkillCatalog({ skills }: { skills: SkillCardData[] }) {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(skills.map((s) => s.category)))],
    [skills],
  );
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = skills.filter((s) => {
    const matchesCat = active === "All" || s.category === active;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCat && matchesQuery;
  });

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                active === c
                  ? "bg-brand-600 text-white"
                  : "border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills…"
          className="input sm:max-w-xs"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <Link
            key={s.id}
            href={`/skills/${s.id}`}
            className="card group flex flex-col p-5 transition hover:border-brand-200 hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon name={s.icon} />
              </div>
              <span
                className={`badge ${STATUS_STYLES[s.status] ?? "bg-ink-100 text-ink-600"}`}
              >
                {s.status}
              </span>
            </div>
            <p className="mt-3 font-semibold text-ink-900 group-hover:text-brand-700">
              {s.name}
            </p>
            <p className="mt-1 flex-1 text-sm text-ink-500">{s.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.tags.slice(0, 3).map((t) => (
                <span key={t} className="badge bg-ink-50 text-ink-500">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 text-xs text-ink-400">
              <span>{s.owner}</span>
              <span>
                {s.runsThisMonth} run{s.runsThisMonth === 1 ? "" : "s"} this month
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-400">
          No skills match your search.
        </p>
      ) : null}
    </>
  );
}
