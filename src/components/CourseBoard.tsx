"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Pagination } from "@/components/Pagination";
import { usePagination } from "@/lib/use-pagination";
import {
  type Course,
  isUpcoming,
  euro,
  fmtRange,
  SPECIALTIES,
  SPECIALTY_LABEL,
  PROGRAM_TYPES,
  PROGRAM_TYPE_LABEL,
} from "@/lib/courses-shared";
import { deleteCourse, publishCourse, unpublishCourse } from "@/app/(app)/courses/actions";
import { CourseKpiRow } from "@/components/CourseKpiRow";

type Tab = "all" | "draft" | "published" | "upcoming" | "past";
type SpecialtyFilter = "" | (typeof SPECIALTIES)[number];
type ProgramTypeFilter = "" | (typeof PROGRAM_TYPES)[number];
type SponsoredFilter = "" | "yes" | "no";

const FILTER_SELECT =
  "rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs text-ink-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100";

export function CourseBoard({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [fSpecialty, setFSpecialty] = useState<SpecialtyFilter>("");
  const [fProgramType, setFProgramType] = useState<ProgramTypeFilter>("");
  const [fSponsored, setFSponsored] = useState<SponsoredFilter>("");
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [rowError, setRowError] = useState("");

  const activeFilters = [fSpecialty, fProgramType, fSponsored].filter(Boolean).length;
  const clearFilters = () => {
    setFSpecialty("");
    setFProgramType("");
    setFSponsored("");
  };

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilters(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const counts = useMemo(() => {
    return {
      all: courses.length,
      draft: courses.filter((c) => !c.is_published).length,
      published: courses.filter((c) => c.is_published).length,
      upcoming: courses.filter((c) => isUpcoming(c)).length,
      past: courses.filter((c) => !isUpcoming(c)).length,
    };
  }, [courses]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "draft", label: "Draft" },
    { id: "published", label: "Published" },
    { id: "upcoming", label: "Upcoming" },
    { id: "past", label: "Past" },
  ];

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return courses.filter((c) => {
      if (tab === "draft" && c.is_published) return false;
      if (tab === "published" && !c.is_published) return false;
      if (tab === "upcoming" && !isUpcoming(c)) return false;
      if (tab === "past" && isUpcoming(c)) return false;
      if (fSpecialty && c.specialty !== fSpecialty) return false;
      if (fProgramType && c.program_type !== fProgramType) return false;
      if (fSponsored === "yes" && !c.is_sponsored) return false;
      if (fSponsored === "no" && c.is_sponsored) return false;
      if (query) {
        const hay = `${c.title.fr} ${c.title.en} ${c.city}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [courses, tab, q, fSpecialty, fProgramType, fSponsored]);

  const {
    page,
    pageSize,
    setPage,
    setPageSize,
    pageCount,
    pageItems: pageCourses,
    total,
    startIndex,
    endIndex,
  } = usePagination(visible);

  const run = (fn: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      setRowError("");
      const res = await fn();
      if (res.error) setRowError(res.error);
      router.refresh();
    });

  return (
    <div>
      <CourseKpiRow courses={visible} />

      {/* Toolbar */}
      <div className="card mb-4 p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" strokeLinecap="round" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, city…"
              className="input !pl-9"
            />
          </div>
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
                showFilters || activeFilters > 0
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M4 5h16M7 12h10M10 19h4" strokeLinecap="round" />
              </svg>
              Filters
              {activeFilters > 0 ? (
                <span className="rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
                  {activeFilters}
                </span>
              ) : null}
            </button>
            {showFilters ? (
              <div className="absolute right-0 z-30 mt-2 w-[min(24rem,90vw)] overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-2xl ring-1 ring-black/5">
                <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50/60 px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600/10 text-brand-600">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M4 5h16M7 12h10M10 19h4" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="text-sm font-semibold text-ink-900">Filters</span>
                    {activeFilters > 0 ? (
                      <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                        {activeFilters}
                      </span>
                    ) : null}
                  </div>
                  {activeFilters > 0 ? (
                    <button
                      onClick={clearFilters}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-ink-500 transition hover:bg-white hover:text-red-600"
                    >
                      Clear all
                    </button>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                  <FilterRow label="Specialty" icon="graduation-cap">
                    <select
                      value={fSpecialty}
                      onChange={(e) => setFSpecialty(e.target.value as SpecialtyFilter)}
                      className="input"
                    >
                      <option value="">All specialties</option>
                      {SPECIALTIES.map((s) => (
                        <option key={s} value={s}>
                          {SPECIALTY_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </FilterRow>
                  <FilterRow label="Programme type" icon="workflow">
                    <select
                      value={fProgramType}
                      onChange={(e) => setFProgramType(e.target.value as ProgramTypeFilter)}
                      className="input"
                    >
                      <option value="">All types</option>
                      {PROGRAM_TYPES.map((p) => (
                        <option key={p} value={p}>
                          {PROGRAM_TYPE_LABEL[p]}
                        </option>
                      ))}
                    </select>
                  </FilterRow>
                  <FilterRow label="Sponsorship" icon="shield-check" className="sm:col-span-2">
                    <select
                      value={fSponsored}
                      onChange={(e) => setFSponsored(e.target.value as SponsoredFilter)}
                      className="input"
                    >
                      <option value="">All</option>
                      <option value="yes">Sponsored</option>
                      <option value="no">Self-funded</option>
                    </select>
                  </FilterRow>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {tabs.map((tb) => {
            const active = tab === tb.id;
            return (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  active ? "bg-brand-600 text-white" : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
                }`}
              >
                {tb.label}
                <span
                  className={`rounded-full px-1.5 text-xs font-semibold tabular-nums ${
                    active ? "bg-white/25 text-white" : "bg-ink-100 text-ink-600"
                  }`}
                >
                  {counts[tb.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {rowError ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{rowError}</p>
      ) : null}

      {/* List */}
      <div className={`card overflow-hidden p-0 transition-opacity ${pending ? "opacity-60" : ""}`}>
        <div className="max-h-[65vh] overflow-y-auto">
          {courses.length === 0 ? (
            <p className="p-10 text-center text-ink-400">
              No courses yet. Create one to get started.
            </p>
          ) : visible.length === 0 ? (
            <p className="p-10 text-center text-ink-400">No courses match these filters.</p>
          ) : (
            pageCourses.map((c, i) => (
              <div
                key={c.id}
                className={`group grid grid-cols-[1.4fr_auto] items-center gap-4 px-5 py-4 transition hover:bg-ink-50 sm:grid-cols-[1.4fr_1fr_auto_auto] ${
                  i > 0 ? "border-t border-ink-100" : ""
                }`}
              >
                <Link href={`/courses/${c.slug}/edit`} className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-ink-900">{c.title.fr}</span>
                    <span
                      className={`badge ${c.is_published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                    >
                      {c.is_published ? "Published" : "Draft"}
                    </span>
                    {c.qualiopi ? <span className="badge bg-brand-50 text-brand-700">Qualiopi</span> : null}
                    <span
                      className={`badge ${c.status === "full" ? "bg-red-50 text-red-700" : "bg-ink-100 text-ink-600"}`}
                    >
                      {c.status}
                    </span>
                    {c.is_sponsored ? <span className="badge bg-violet-50 text-violet-700">Sponsored</span> : null}
                  </div>
                  <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
                    {SPECIALTY_LABEL[c.specialty] ?? c.specialty} · {c.level} · {c.city}
                  </p>
                </Link>
                <Link href={`/courses/${c.slug}/edit`} className="hidden min-w-0 sm:block">
                  <p className="text-sm text-ink-600">{fmtRange(c.start_date, c.end_date)}</p>
                  <p className="mt-0.5 text-xs tabular-nums text-ink-400">
                    {c.enrolled}/{c.capacity} · {euro(c.price_eur)}
                  </p>
                </Link>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      run(() => (c.is_published ? unpublishCourse(c.slug) : publishCourse(c.slug)))
                    }
                    disabled={pending}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      c.is_published
                        ? "text-ink-500 hover:bg-ink-100"
                        : "bg-brand-600 text-white hover:bg-brand-700"
                    }`}
                    title={c.is_published ? "Unpublish (hide from the public site)" : "Publish (show on the public site)"}
                  >
                    {c.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(c)}
                    className="rounded-lg p-1.5 text-ink-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 focus-visible:opacity-100"
                    title="Delete course"
                    aria-label="Delete course"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
                <Link href={`/courses/${c.slug}/edit`} className="hidden text-sm font-semibold text-brand-600 lg:block">
                  Edit →
                </Link>
              </div>
            ))
          )}
        </div>
        {visible.length > 0 && (
          <Pagination
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            total={total}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete course"
        message={deleteTarget ? `Delete "${deleteTarget.title.fr}"? This cannot be undone.` : ""}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            run(() => deleteCourse(deleteTarget.slug));
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

function FilterRow({
  label,
  icon,
  className,
  children,
}: {
  label: string;
  icon?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
        {icon ? <Icon name={icon} className="h-3 w-3 text-ink-400" /> : null}
        {label}
      </label>
      {children}
    </div>
  );
}
