"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import {
  type Lead,
  type Stage,
  type Parcours,
  type InterestLevel,
  PARCOURS,
  PARCOURS_LABEL,
  PARCOURS_TONE,
  stagesFor,
  stageLabel,
  stageShort,
  stageTone,
  advanceLabelFor,
  normalizeParcours,
  INTEREST_LEVELS,
  INTEREST_LABEL,
} from "@/lib/leads-shared";
import {
  advanceStage,
  setInterest,
  setNotInterested,
  toggleReminders,
  addComment,
  deleteLead,
  uploadDocument,
  verifyAndConfirm,
  getDocumentUrl,
  setLeadContractTemplate,
} from "@/app/(app)/leads/actions";
import type { ContractTemplate } from "@/lib/contracts-shared";

/** Which stage timestamp field on a Lead corresponds to each stage id. */
const STAGE_TS_FIELD: Record<Stage, keyof Lead | null> = {
  lead: null,
  confirmed: "confirmed_at",
  done: "done_at",
  enrollment_form: "enrollment_form_at",
  dates_validation: "dates_validated_at",
  invoice: "invoice_paid_at",
  elearning_check: "elearning_checked_at",
  simulator_access: "simulator_access_at",
  prerequisites: "prerequisites_ok_at",
  pre_registration: "pre_registration_at",
  deposit_contract: "deposit_contract_at",
  practical_info: "practical_info_at",
  elearning_sent: "elearning_sent_at",
  deposit_refunded: "deposit_refunded_at",
};

const INT_DOT: Record<InterestLevel, string> = {
  highly_interested: "bg-emerald-500",
  interested: "bg-brand-500",
  neutral: "bg-ink-300",
  not_interested: "bg-red-500",
  unreachable: "bg-orange-500",
};

const fmtDay = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "";

const euro = (n?: number) => "€" + (n ?? 0).toLocaleString("fr-FR");

function fmtRange(a?: string, b?: string) {
  if (!a) return "—";
  const s = new Date(a);
  const e = new Date(b || a);
  const o = { day: "numeric", month: "short" } as const;
  return `${s.toLocaleDateString("en-GB", o)} – ${e.toLocaleDateString("en-GB", o)} ${e.getFullYear()}`;
}

type Tab = Stage | "all" | "not_interested";
type ParcoursFilter = Parcours | "all";

export function LeadBoard({
  leads,
  isAdmin = false,
  templates = [],
  publicBase = null,
}: {
  leads: Lead[];
  isAdmin?: boolean;
  templates?: ContractTemplate[];
  publicBase?: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [parcoursFilter, setParcoursFilter] = useState<ParcoursFilter>("all");
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [fSession, setFSession] = useState("");
  const [fInterest, setFInterest] = useState("");
  const [fReminders, setFReminders] = useState("");
  const [fAccommodation, setFAccommodation] = useState("");
  const [fElearning, setFElearning] = useState("");
  const [fDocStatus, setFDocStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const activeFilters =
    [fSession, fInterest, fReminders, fAccommodation, fElearning, fDocStatus].filter(
      Boolean,
    ).length;
  const clearFilters = () => {
    setFSession("");
    setFInterest("");
    setFReminders("");
    setFAccommodation("");
    setFElearning("");
    setFDocStatus("");
  };

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  // Keep the drawer's content during the close animation.
  const liveLead = leads.find((l) => l.id === openId) ?? null;
  const keepRef = useRef<Lead | null>(null);
  if (liveLead) keepRef.current = liveLead;
  const drawerLead = liveLead ?? keepRef.current;
  const open = Boolean(openId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setShowFilters(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const sessions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const l of leads)
      if (l.training_id && l.trainings)
        seen.set(l.training_id, l.trainings.title.fr);
    return Array.from(seen, ([id, title]) => ({ id, title }));
  }, [leads]);

  // Stage tabs only make sense within a single parcours (the two stage sets
  // differ). When viewing "all" parcours we show just All + Not interested.
  const stageList: readonly Stage[] =
    parcoursFilter === "all" ? [] : stagesFor(parcoursFilter);

  // Reset the stage tab whenever the parcours scope changes (a stage tab from
  // one parcours is meaningless in the other).
  useEffect(() => {
    setTab("all");
  }, [parcoursFilter]);

  const counts = useMemo(() => {
    const scoped =
      parcoursFilter === "all"
        ? leads
        : leads.filter((l) => normalizeParcours(l) === parcoursFilter);
    const c: Record<string, number> = {
      all: scoped.length,
      not_interested: scoped.filter((l) => l.interest === "not_interested").length,
    };
    for (const s of stageList) c[s] = scoped.filter((l) => l.stage === s).length;
    return c;
  }, [leads, parcoursFilter, stageList]);

  const tabs: Tab[] = [
    "all",
    ...stageList,
    ...(counts.not_interested > 0 ? (["not_interested"] as Tab[]) : []),
  ];

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (parcoursFilter !== "all" && normalizeParcours(l) !== parcoursFilter)
        return false;
      if (tab === "not_interested") {
        if (l.interest !== "not_interested") return false;
      } else if (tab !== "all" && l.stage !== tab) return false;
      if (fSession && l.training_id !== fSession) return false;
      if (fInterest && l.interest !== fInterest) return false;
      if (fReminders === "on" && !l.reminders_active) return false;
      if (fReminders === "off" && l.reminders_active) return false;
      if (fAccommodation === "yes" && !l.needs_accommodation) return false;
      if (fAccommodation === "no" && l.needs_accommodation) return false;
      if (fElearning === "yes" && !l.elearning_access) return false;
      if (fElearning === "no" && l.elearning_access) return false;
      if (fDocStatus) {
        const docs = l.documents ?? [];
        const hasPending = docs.some((d) => !d.verified);
        const hasVerified = docs.some((d) => d.verified);
        if (fDocStatus === "none" && docs.length > 0) return false;
        if (fDocStatus === "pending" && !hasPending) return false;
        if (fDocStatus === "verified" && !hasVerified) return false;
      }
      if (query) {
        const hay =
          `${l.first_name} ${l.last_name} ${l.email} ${l.institution} ${l.profession} ${l.country} ${l.ref ?? ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [leads, parcoursFilter, tab, q, fSession, fInterest, fReminders, fAccommodation, fElearning, fDocStatus]);

  return (
    <div>
      {/* Toolbar */}
      <div className="card mb-4 p-4">
        {/* Parcours split — HelpMeSee vs Bootcamps & Workshops */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-400">
            Parcours
          </span>
          <div className="inline-flex rounded-xl border border-ink-200 bg-white p-0.5">
            {(["all", ...PARCOURS] as ParcoursFilter[]).map((p) => {
              const active = parcoursFilter === p;
              const label = p === "all" ? "Tous" : PARCOURS_LABEL[p];
              return (
                <button
                  key={p}
                  onClick={() => setParcoursFilter(p)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    active
                      ? "bg-brand-600 text-white"
                      : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
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
              placeholder="Search name, email, institution, profession…"
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
              <div className="absolute right-0 z-30 mt-2 w-72 space-y-3 rounded-xl border border-ink-100 bg-white p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-ink-400">
                    Filters
                  </span>
                  {activeFilters > 0 ? (
                    <button onClick={clearFilters} className="text-xs font-medium text-brand-600 hover:underline">
                      Clear all
                    </button>
                  ) : null}
                </div>
                <FilterRow label="Session">
                  <select value={fSession} onChange={(e) => setFSession(e.target.value)} className="input">
                    <option value="">All sessions</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </FilterRow>
                <FilterRow label="Interest">
                  <select value={fInterest} onChange={(e) => setFInterest(e.target.value)} className="input">
                    <option value="">All</option>
                    {INTEREST_LEVELS.map((i) => (
                      <option key={i} value={i}>
                        {INTEREST_LABEL[i]}
                      </option>
                    ))}
                  </select>
                </FilterRow>
                <FilterRow label="Reminders">
                  <select value={fReminders} onChange={(e) => setFReminders(e.target.value)} className="input">
                    <option value="">All</option>
                    <option value="on">On</option>
                    <option value="off">Off</option>
                  </select>
                </FilterRow>
                <FilterRow label="Signed document">
                  <select value={fDocStatus} onChange={(e) => setFDocStatus(e.target.value)} className="input">
                    <option value="">All</option>
                    <option value="pending">Pending verification</option>
                    <option value="verified">Verified</option>
                    <option value="none">No document</option>
                  </select>
                </FilterRow>
                <FilterRow label="Accommodation">
                  <select value={fAccommodation} onChange={(e) => setFAccommodation(e.target.value)} className="input">
                    <option value="">All</option>
                    <option value="yes">Needed</option>
                    <option value="no">Not needed</option>
                  </select>
                </FilterRow>
                <FilterRow label="E-learning">
                  <select value={fElearning} onChange={(e) => setFElearning(e.target.value)} className="input">
                    <option value="">All</option>
                    <option value="yes">Enabled</option>
                    <option value="no">Disabled</option>
                  </select>
                </FilterRow>
              </div>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tabs.map((t) => {
            const active = tab === t;
            const label =
              t === "all"
                ? "All"
                : t === "not_interested"
                  ? "Not interested"
                  : parcoursFilter === "all"
                    ? t
                    : stageLabel(parcoursFilter, t);
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand-600 text-white"
                    : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
                }`}
              >
                {label}
                <span
                  className={`rounded-full px-1.5 text-xs font-semibold tabular-nums ${
                    active ? "bg-white/25 text-white" : "bg-ink-100 text-ink-600"
                  }`}
                >
                  {counts[t] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List (scrollable so long lists don't push the page) */}
      <div className="mb-2 flex items-center justify-between px-1 text-xs text-ink-400">
        <span>
          {visible.length} of {leads.length} lead{leads.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="card max-h-[60vh] min-h-[160px] overflow-y-auto">
        {leads.length === 0 ? (
          <p className="p-10 text-center text-ink-400">
            No leads yet. Submit the registration form on the website to see the
            pipeline fill up.
          </p>
        ) : visible.length === 0 ? (
          <p className="p-10 text-center text-ink-400">No leads match your filters.</p>
        ) : (
          visible.map((l, i) => (
            <button
              key={l.id}
              onClick={() => setOpenId(l.id)}
              className={`grid w-full grid-cols-[1.4fr_auto] items-center gap-4 px-4 py-3 text-left transition hover:bg-ink-50 sm:grid-cols-[1.4fr_1.3fr_auto] ${
                i > 0 ? "border-t border-ink-100" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold text-ink-900">
                    {l.first_name} {l.last_name}
                  </span>
                  <span className={`badge ${PARCOURS_TONE[normalizeParcours(l)]}`}>
                    {PARCOURS_LABEL[normalizeParcours(l)]}
                  </span>
                  <span className={`badge ${stageTone(normalizeParcours(l), l.stage)}`}>
                    {stageLabel(normalizeParcours(l), l.stage)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
                  {l.profession || "—"}
                  {l.institution ? ` · ${l.institution}` : ""}
                </p>
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-medium text-ink-700">
                  {l.trainings?.title.fr ?? l.training_title_snapshot ?? "—"}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-400">
                  {l.trainings?.city ?? ""}
                </p>
              </div>
              <div className="flex items-center justify-end gap-3.5">
                <span className="hidden items-center gap-1.5 text-xs text-ink-600 md:inline-flex">
                  <i className={`h-2 w-2 rounded-full ${INT_DOT[l.interest]}`} />
                  {INTEREST_LABEL[l.interest]}
                </span>
                <Icon
                  name="mail"
                  className={`h-4 w-4 ${l.reminders_active ? "text-emerald-600" : "text-ink-300"}`}
                />
                <span className="font-mono text-[11px] text-ink-400">
                  {l.ref ?? l.id.slice(0, 8)}
                </span>
                <svg
                  className="h-4 w-4 text-ink-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Scrim + drawer */}
      <div
        onClick={() => setOpenId(null)}
        className={`fixed inset-0 z-40 bg-ink-900/35 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Lead detail"
        className={`fixed right-0 top-0 z-50 flex h-screen w-[524px] max-w-[94vw] flex-col bg-white shadow-2xl transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        } motion-reduce:transition-none`}
      >
        {drawerLead ? (
          <LeadDrawer
            lead={drawerLead}
            isAdmin={isAdmin}
            pending={pending}
            run={run}
            templates={templates}
            publicBase={publicBase}
            onClose={() => setOpenId(null)}
            onDeleted={() => setOpenId(null)}
          />
        ) : null}
      </aside>
    </div>
  );
}

function LeadDrawer({
  lead,
  isAdmin,
  pending,
  run,
  templates,
  publicBase,
  onClose,
  onDeleted,
}: {
  lead: Lead;
  isAdmin: boolean;
  pending: boolean;
  run: (fn: () => Promise<unknown>) => void;
  templates: ContractTemplate[];
  publicBase: string | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [note, setNote] = useState("");
  const parcours = normalizeParcours(lead);
  const stages = stagesFor(parcours);
  const idx = stages.indexOf(lead.stage);
  const last = stages.length - 1;
  const pct = idx <= 0 ? 0 : idx >= last ? 100 : (idx / last) * 100;
  const advance = advanceLabelFor(parcours, lead.stage);
  const t = lead.trainings;
  const tsFor = (s: Stage) => {
    const f = STAGE_TS_FIELD[s];
    return f ? fmtDay(lead[f] as string | null | undefined) : "";
  };

  const sendNote = () => {
    const v = note.trim();
    if (!v) return;
    run(() => addComment(lead.id, v));
    setNote("");
  };

  // Comments oldest→newest for chat reading (getLeads returns newest-first).
  const chat = [...lead.lead_comments].reverse();

  return (
    <>
      {/* Header */}
      <div className="border-b border-ink-100 px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="flex flex-wrap items-center gap-2.5 text-lg font-bold text-ink-900">
            {lead.first_name} {lead.last_name}
            <span className={`badge ${PARCOURS_TONE[parcours]}`}>
              {PARCOURS_LABEL[parcours]}
            </span>
            <span className={`badge ${stageTone(parcours, lead.stage)}`}>
              {stageLabel(parcours, lead.stage)}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-0.5 text-xl leading-none text-ink-400 hover:bg-ink-50 hover:text-ink-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1 text-[13px] text-ink-500">
          <span>{lead.email}</span>
          {lead.phone ? <span>· {lead.phone}</span> : null}
          <span>· {lead.country || "—"}</span>
        </p>
        <p className="mt-1.5 font-mono text-[11px] text-ink-400">
          {lead.ref ?? lead.id.slice(0, 8)}
        </p>
      </div>

      {/* Body */}
      <div className={`flex-1 overflow-y-auto ${pending ? "opacity-60" : ""}`}>
        {/* Workflow */}
        <div className="border-b border-ink-100 px-6 py-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">
            Workflow
          </p>
          <div className="relative flex items-start justify-between px-1">
            <div className="absolute left-[14%] right-[14%] top-[13px] h-0.5 bg-ink-200">
              <div className="h-full bg-brand-600" style={{ width: `${pct}%` }} />
            </div>
            {stages.map((s, i) => {
              const done = i < idx;
              const cur = i === idx;
              return (
                <div key={s} className="relative z-10 flex flex-1 flex-col items-center">
                  <div
                    className={`grid h-[26px] w-[26px] place-items-center rounded-full border-2 text-xs font-bold ${
                      done
                        ? "border-brand-600 bg-brand-600 text-white"
                        : cur
                          ? "border-brand-600 bg-white text-brand-600 ring-4 ring-brand-50"
                          : "border-ink-200 bg-white text-ink-300"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <div className="mt-1.5 text-center text-[11px] font-semibold text-ink-600">
                    {stageShort(parcours, s)}
                  </div>
                  <div className="mt-0.5 text-[10px] tabular-nums text-ink-400">
                    {tsFor(s)}
                  </div>
                </div>
              );
            })}
          </div>

          {lead.lms_user_id ? (
            <p className="mt-3 text-xs font-medium text-emerald-600">
              LMS provisioned · {lead.lms_user_id}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {advance ? (
              <button
                onClick={() => run(() => advanceStage(lead.id, lead.stage, parcours))}
                className="btn-primary !py-2 !text-sm"
              >
                {advance} →
              </button>
            ) : (
              <span className="badge bg-emerald-50 text-emerald-700">
                <Icon name="check" className="h-3.5 w-3.5" /> Parcours terminé
              </span>
            )}
            <select
              value={lead.interest}
              onChange={(e) =>
                run(() => setInterest(lead.id, e.target.value as InterestLevel))
              }
              className="rounded-full border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-700"
            >
              {INTEREST_LEVELS.map((i) => (
                <option key={i} value={i}>
                  {INTEREST_LABEL[i]}
                </option>
              ))}
            </select>
            <button
              onClick={() => run(() => toggleReminders(lead.id, !lead.reminders_active))}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                lead.reminders_active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-ink-100 text-ink-500"
              }`}
            >
              <Icon name="mail" className="h-3.5 w-3.5" />
              {lead.reminders_active ? "Reminders on" : "Reminders off"}
            </button>
            {lead.interest !== "not_interested" ? (
              <button
                onClick={() => run(() => setNotInterested(lead.id))}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                title="Sortie du parcours"
              >
                Non intéressé
              </button>
            ) : null}
          </div>
        </div>

        {/* Session & logistics */}
        <div className="border-b border-ink-100 px-6 py-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">
            Session &amp; logistics
          </p>
          <dl className="grid grid-cols-[104px_1fr] gap-x-3 gap-y-1.5 text-[13px]">
            <dt className="text-ink-400">Session</dt>
            <dd className="text-ink-700">
              {t?.title.fr ?? lead.training_title_snapshot ?? "—"}
            </dd>
            <dt className="text-ink-400">When</dt>
            <dd className="text-ink-700">
              {t ? `${fmtRange(t.start_date, t.end_date)} · ${t.city}` : "—"}
            </dd>
            <dt className="text-ink-400">Price</dt>
            <dd className="text-ink-700">
              {t ? `${euro(t.price_eur)} · deposit ${euro(t.deposit_eur)}` : "—"}
            </dd>
            <dt className="text-ink-400">Diet</dt>
            <dd className="text-ink-700">{lead.dietary || "—"}</dd>
            <dt className="text-ink-400">Arrival</dt>
            <dd className="text-ink-700">{lead.arrival || "—"}</dd>
            <dt className="text-ink-400">Extras</dt>
            <dd className="text-ink-700">
              Accommodation {lead.needs_accommodation ? "Yes" : "No"} · e-learning{" "}
              {lead.elearning_access ? "Yes" : "No"}
            </dd>
          </dl>
        </div>

        {/* Engagement contract (template, from the platform) */}
        <div className="border-b border-ink-100 px-6 py-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">
            Engagement contract
          </p>
          <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 px-3.5 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 bg-white text-ink-500">
              <Icon name="clipboard-check" className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-ink-900">
                {lead.contract_template?.name ?? "No contract attached yet"}
              </p>
              <p className="text-xs text-ink-500">
                {lead.contract_template
                  ? "Selected from the platform templates."
                  : "Attaches automatically when the deposit is marked paid."}
              </p>
            </div>
            {lead.contract_template?.file_url && publicBase ? (
              <a
                href={`${publicBase}/storage/v1/object/public/contracts/${lead.contract_template.file_url}`}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost !py-1.5 !text-xs"
              >
                View
              </a>
            ) : null}
          </div>
          {templates.length > 0 ? (
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-[11px] text-ink-500">Template:</span>
              <select
                value={lead.contract_template_id ?? ""}
                onChange={(e) => run(() => setLeadContractTemplate(lead.id, e.target.value))}
                className="rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs text-ink-700"
              >
                <option value="">— none —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.is_default ? " (default)" : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-ink-400">
              No templates yet. Add them in Contract templates (admin).
            </p>
          )}
        </div>

        {/* Documents (the signed copy returned by the lead) */}
        <div className="border-b border-ink-100 px-6 py-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">
            Signed document
          </p>
          <DocState lead={lead} />
        </div>

        {/* Comments */}
        <div className="px-6 py-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">
            Comments
          </p>
          <div className="space-y-3">
            {lead.notes ? (
              <div>
                <p className="mb-1 text-[11px] text-ink-400">From the registrant</p>
                <p className="rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-[13px] italic text-ink-600">
                  “{lead.notes}”
                </p>
              </div>
            ) : null}
            {chat.length === 0 && !lead.notes ? (
              <p className="text-[13px] text-ink-400">No follow-up notes yet.</p>
            ) : null}
            {chat.map((c) => (
              <div key={c.id}>
                <p className="mb-1 text-[11px] text-ink-400">
                  {fmtDay(c.created_at)} · {c.author ?? "Staff"}
                </p>
                <p className="rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-[13px] text-ink-700">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Composer (pinned) */}
      <div className="flex items-center gap-2 border-t border-ink-100 px-4 py-3">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendNote()}
          placeholder="Write a follow-up note…"
          className="input"
        />
        <button onClick={sendNote} className="btn-primary !py-2 !text-sm">
          Send
        </button>
        {isAdmin ? (
          <button
            onClick={() => {
              if (confirm(`Delete lead ${lead.first_name} ${lead.last_name}?`)) {
                run(() => deleteLead(lead.id));
                onDeleted();
              }
            }}
            className="rounded-xl px-2.5 py-2 text-sm text-red-500 hover:bg-red-50"
            title="Admin only"
            aria-label="Delete lead"
          >
            ✕
          </button>
        ) : null}
      </div>
    </>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-ink-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function DocState({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [busy, startBusy] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState("");

  const parcours = normalizeParcours(lead);
  const doc = lead.documents?.[0] ?? null;
  const confirmedOrLater =
    lead.stage === "confirmed" ||
    lead.stage === "done" ||
    lead.stage === "deposit_refunded";

  const state = doc
    ? doc.verified
      ? { text: "Signé & vérifié. Place confirmée.", pill: "Verified", tone: "bg-emerald-50 text-emerald-700" }
      : {
          text: `Chargé & signé (${doc.sign_channel ?? "manual"}) — en attente de vérification.`,
          pill: "Pending verification",
          tone: "bg-amber-50 text-amber-700",
        }
    : confirmedOrLater
      ? { text: "Aucun document en attente à ce stade.", pill: "None", tone: "bg-ink-100 text-ink-500" }
      : lead.stage === "lead"
        ? { text: "Envoyé au lead après les premières étapes du parcours.", pill: "Not sent", tone: "bg-ink-100 text-ink-500" }
        : { text: "En attente du document d'engagement signé.", pill: "Awaiting signature", tone: "bg-amber-50 text-amber-700" };

  const view = () =>
    startBusy(async () => {
      if (!doc?.file_url) return;
      const url = await getDocumentUrl(doc.file_url);
      if (url) window.open(url, "_blank", "noopener");
    });

  const upload = () => {
    if (!file) return;
    setErr("");
    startBusy(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const r = await uploadDocument(lead.id, fd, parcours);
      if (r.error) setErr(r.error);
      else {
        setFile(null);
        router.refresh();
      }
    });
  };

  const verify = () =>
    startBusy(async () => {
      if (!doc) return;
      await verifyAndConfirm(lead.id, doc.id);
      router.refresh();
    });

  return (
    <div className={busy ? "opacity-60" : ""}>
      <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 px-3.5 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 bg-white text-ink-500">
          <Icon name="clipboard-check" className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-ink-900">Engagement document</p>
          <p className="text-xs text-ink-500">{state.text}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${state.tone}`}>
          {state.pill}
        </span>
      </div>

      {/* Existing document → view / verify */}
      {doc ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button onClick={view} className="btn-ghost !py-1.5 !text-xs">
            📄 View signed document
          </button>
          {!doc.verified ? (
            <button onClick={verify} className="btn-primary !py-1.5 !text-xs">
              Verify &amp; confirm seat →
            </button>
          ) : null}
        </div>
      ) : !confirmedOrLater ? (
        /* No document → staff uploads the signed doc the lead returned */
        <div className="mt-2.5">
          <label className="mb-1 block text-[11px] font-medium text-ink-500">
            Upload the signed engagement document
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-xs text-ink-600 file:mr-2 file:rounded-lg file:border-0 file:bg-brand-50 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-brand-700"
            />
            <button
              onClick={upload}
              disabled={!file || busy}
              className="btn-primary !py-1.5 !text-xs disabled:opacity-50"
            >
              Upload &amp; mark signed
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-ink-400">
            Online e-signing (Documenso) attaches here automatically once n8n is wired.
          </p>
        </div>
      ) : null}

      {err ? <p className="mt-2 text-xs text-red-600">{err}</p> : null}
    </div>
  );
}
