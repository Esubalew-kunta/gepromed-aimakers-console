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
  resolveAdvance,
  normalizeParcours,
  INTEREST_LEVELS,
} from "@/lib/leads-shared";
import {
  advanceStage,
  setInterest,
  setNotInterested,
  cancelRegistration,
  reinstateLead,
  toggleReminders,
  addComment,
  deleteLead,
  uploadDocument,
  verifyAndConfirm,
  getDocumentUrl,
  setLeadContractTemplate,
  setCautionWaived,
  setAttended,
  verifyEligibility,
  setElearningCompleted,
} from "@/app/(app)/trainees/actions";
import type { ContractTemplate } from "@/lib/contracts-shared";
import { useT, useLang, type Lang, type DictKey } from "@/lib/i18n";

/** Which stage timestamp field on a Lead corresponds to each stage id. */
const STAGE_TS_FIELD: Record<Stage, keyof Lead | null> = {
  lead: null,
  confirmed: "confirmed_at",
  done: "done_at",
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

/** i18n key per interest level — INTEREST_LABEL in leads-shared.ts is
 * English-only data, this maps it to the app's translated dictionary. */
const INTEREST_KEY: Record<InterestLevel, DictKey> = {
  highly_interested: "pipeline.interest.highlyInterested",
  interested: "pipeline.interest.interested",
  neutral: "pipeline.interest.neutral",
  not_interested: "pipeline.interest.notInterested",
  unreachable: "pipeline.interest.unreachable",
};

const fmtDay = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "";

const euro = (n?: number) => "€" + (n ?? 0).toLocaleString("fr-FR");

function fmtRange(a?: string, b?: string) {
  if (!a) return "–";
  const s = new Date(a);
  const e = new Date(b || a);
  const o = { day: "numeric", month: "short" } as const;
  return `${s.toLocaleDateString("en-GB", o)} – ${e.toLocaleDateString("en-GB", o)} ${e.getFullYear()}`;
}

type Tab = Stage | "all" | "not_interested";
type ParcoursFilter = Parcours | "all";

/**
 * Per-step guidance for the drawer's focused "Current step" card:
 *  • what      — what this step means
 *  • waitingFor— the milestone we're waiting on before it can advance
 *  • onAdvance — what confirming/advancing triggers in the background
 * Makes every stage read distinctly instead of a generic screen.
 */
type StepHelp = { what: string; waitingFor: string; onAdvance: string };
const STAGE_HELP: Record<Parcours, Partial<Record<Stage, Record<Lang, StepHelp>>>> = {
  helpmesee: {
    lead: {
      fr: {
        what: "Trainee référencé par la fondation HelpMeSee.",
        waitingFor: "Prise en charge du dossier par l'équipe.",
        onAdvance: "Démarre le suivi → email « validation des dates ».",
      },
      en: {
        what: "Trainee referred by the HelpMeSee foundation.",
        waitingFor: "The team taking ownership of the case.",
        onAdvance: "Starts the follow-up → \"dates validation\" email.",
      },
    },
    dates_validation: {
      fr: {
        what: "Validation des dates de formation avec un instructeur.",
        waitingFor: "Dates confirmées avec un instructeur.",
        onAdvance: "Confirme les dates → email « facture émise ».",
      },
      en: {
        what: "Validating the training dates with an instructor.",
        waitingFor: "Dates confirmed with an instructor.",
        onAdvance: "Confirms the dates → \"invoice issued\" email.",
      },
    },
    invoice: {
      fr: {
        what: "Facture émise (prise en charge par la fondation).",
        waitingFor: "Règlement de la facture par la fondation.",
        onAdvance: "Marque la facture payée → email « modules e-learning ».",
      },
      en: {
        what: "Invoice issued (covered by the foundation).",
        waitingFor: "Invoice payment by the foundation.",
        onAdvance: "Marks the invoice paid → \"e-learning modules\" email.",
      },
    },
    elearning_check: {
      fr: {
        what: "GATE — les modules e-learning de la fondation (externes à Gepromed) doivent être vérifiés AVANT l'accès simulateur.",
        waitingFor: "Preuve de complétion des modules fondation.",
        onAdvance: "Débloque l'accès → email « accès simulateur + infos pratiques ».",
      },
      en: {
        what: "GATE — the foundation's e-learning modules (external to Gepromed) must be verified BEFORE simulator access.",
        waitingFor: "Proof of completion of the foundation modules.",
        onAdvance: "Unlocks access → \"simulator access + practical info\" email.",
      },
    },
    simulator_access: {
      fr: {
        what: "Identifiants simulateur + infos pratiques envoyés.",
        waitingFor: "Prêt à confirmer la place.",
        onAdvance: "Confirme la place → email « place confirmée » + LMS.",
      },
      en: {
        what: "Simulator credentials + practical info sent.",
        waitingFor: "Ready to confirm the seat.",
        onAdvance: "Confirms the seat → \"seat confirmed\" email + LMS.",
      },
    },
    confirmed: {
      fr: {
        what: "Prêt — formation planifiée.",
        waitingFor: "Déroulement de la formation.",
        onAdvance: "Clôture → email « questionnaire de satisfaction ».",
      },
      en: {
        what: "Ready — training scheduled.",
        waitingFor: "The training taking place.",
        onAdvance: "Closes out → \"satisfaction survey\" email.",
      },
    },
    done: {
      fr: { what: "Parcours terminé — satisfaction envoyée.", waitingFor: "—", onAdvance: "" },
      en: { what: "Track completed — satisfaction survey sent.", waitingFor: "—", onAdvance: "" },
    },
  },
  bootcamp: {
    lead: {
      fr: {
        what: "Nouvelle demande d'inscription reçue.",
        waitingFor: "Prise en charge et vérification des prérequis.",
        onAdvance: "Démarre le suivi → étape prérequis.",
      },
      en: {
        what: "New registration request received.",
        waitingFor: "Case taken on and prerequisites checked.",
        onAdvance: "Starts the follow-up → prerequisites step.",
      },
    },
    prerequisites: {
      fr: {
        what: "GATE — vérifiez spécialité / statut / pays (Bootcamp = chirurgie vasculaire) et le contrat.",
        waitingFor: "Décision d'éligibilité (conforme / non conforme).",
        onAdvance: "Si conforme → email « caution 200 € + contrat » et contrat attaché automatiquement.",
      },
      en: {
        what: "GATE — check specialty / status / country (Bootcamp = vascular surgery) and the contract.",
        waitingFor: "Eligibility decision (compliant / not compliant).",
        onAdvance: "If compliant → \"€200 deposit + contract\" email, contract attached automatically.",
      },
    },
    pre_registration: {
      fr: {
        what: "Caution 200 € + contrat d'engagement demandés (contrat attaché).",
        waitingFor: "Caution payée ET contrat signé reçus.",
        onAdvance: "Confirme la réception → email « caution et contrat reçus ».",
      },
      en: {
        what: "€200 deposit + engagement contract requested (contract attached).",
        waitingFor: "Deposit paid AND signed contract received.",
        onAdvance: "Confirms receipt → \"deposit and contract received\" email.",
      },
    },
    deposit_contract: {
      fr: {
        what: "Caution et contrat reçus.",
        waitingFor: "Envoi des infos pratiques (J-30).",
        onAdvance: "Email « infos pratiques » (logo sponsor OU tarif — Règle 1).",
      },
      en: {
        what: "Deposit and contract received.",
        waitingFor: "Sending practical info (D-30).",
        onAdvance: "\"Practical info\" email (sponsor logo OR price — Rule 1).",
      },
    },
    practical_info: {
      fr: {
        what: "Infos pratiques envoyées (J-30).",
        waitingFor: "Envoi de l'accès e-learning (J-15/7).",
        onAdvance: "Email « accès e-learning » (LMS Gepromed).",
      },
      en: {
        what: "Practical info sent (D-30).",
        waitingFor: "Sending e-learning access (D-15/7).",
        onAdvance: "\"E-learning access\" email (Gepromed LMS).",
      },
    },
    elearning_sent: {
      fr: {
        what: "Accès e-learning envoyés (J-15/7).",
        waitingFor: "Prêt à confirmer la place.",
        onAdvance: "Confirme la place → email « place confirmée » + LMS.",
      },
      en: {
        what: "E-learning access sent (D-15/7).",
        waitingFor: "Ready to confirm the seat.",
        onAdvance: "Confirms the seat → \"seat confirmed\" email + LMS.",
      },
    },
    confirmed: {
      fr: {
        what: "Prêt pour l'événement. La présence conditionne le remboursement.",
        waitingFor: "Déroulement de l'événement + confirmation de présence.",
        onAdvance: "Caution remboursée (si présent en intégralité) sinon clôture.",
      },
      en: {
        what: "Ready for the event. Attendance conditions the refund.",
        waitingFor: "The event taking place + attendance confirmation.",
        onAdvance: "Deposit refunded (if attended in full), otherwise closed out.",
      },
    },
    deposit_refunded: {
      fr: {
        what: "Caution remboursée.",
        waitingFor: "Clôture (modules finaux + satisfaction).",
        onAdvance: "Email « modules finaux + satisfaction ».",
      },
      en: {
        what: "Deposit refunded.",
        waitingFor: "Closing out (final modules + satisfaction).",
        onAdvance: "\"Final modules + satisfaction\" email.",
      },
    },
    done: {
      fr: { what: "Parcours terminé — modules finaux + satisfaction.", waitingFor: "—", onAdvance: "" },
      en: { what: "Track completed — final modules + satisfaction.", waitingFor: "—", onAdvance: "" },
    },
  },
};

export function LeadBoard({
  leads,
  isAdmin = false,
  templates = [],
  publicBase = null,
  onVisibleChange,
}: {
  leads: Lead[];
  isAdmin?: boolean;
  templates?: ContractTemplate[];
  publicBase?: string | null;
  /** Reports the currently filtered/visible leads upward, so a parent can
   * keep KPI stats in sync with whatever this board is showing right now. */
  onVisibleChange?: (visible: Lead[]) => void;
}) {
  const router = useRouter();
  const t = useT();
  const { lang } = useLang();
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
        seen.set(l.training_id, l.trainings.title[lang] ?? l.trainings.title.fr);
    return Array.from(seen, ([id, title]) => ({ id, title }));
  }, [leads, lang]);

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

  useEffect(() => {
    onVisibleChange?.(visible);
  }, [visible, onVisibleChange]);

  return (
    <div>
      {/* Toolbar */}
      <div className="card mb-4 p-4">
        {/* Parcours split, HelpMeSee vs Bootcamps & Workshops */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-400">
            {t("pipeline.parcoursLabel")}
          </span>
          <div className="inline-flex rounded-xl border border-ink-200 bg-white p-0.5">
            {(["all", ...PARCOURS] as ParcoursFilter[]).map((p) => {
              const active = parcoursFilter === p;
              const label = p === "all" ? t("pipeline.all") : PARCOURS_LABEL[p];
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
              placeholder={t("pipeline.searchPlaceholder")}
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
              {t("pipeline.filters")}
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
                    {t("pipeline.filters")}
                  </span>
                  {activeFilters > 0 ? (
                    <button onClick={clearFilters} className="text-xs font-medium text-brand-600 hover:underline">
                      {t("pipeline.clearAll")}
                    </button>
                  ) : null}
                </div>
                <FilterRow label={t("pipeline.filterSession")}>
                  <select value={fSession} onChange={(e) => setFSession(e.target.value)} className="input">
                    <option value="">{t("pipeline.filterAllSessions")}</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </FilterRow>
                <FilterRow label={t("pipeline.filterInterest")}>
                  <select value={fInterest} onChange={(e) => setFInterest(e.target.value)} className="input">
                    <option value="">{t("pipeline.filterAll")}</option>
                    {INTEREST_LEVELS.map((i) => (
                      <option key={i} value={i}>
                        {t(INTEREST_KEY[i])}
                      </option>
                    ))}
                  </select>
                </FilterRow>
                <FilterRow label={t("pipeline.filterReminders")}>
                  <select value={fReminders} onChange={(e) => setFReminders(e.target.value)} className="input">
                    <option value="">{t("pipeline.filterAll")}</option>
                    <option value="on">{t("pipeline.filterOn")}</option>
                    <option value="off">{t("pipeline.filterOff")}</option>
                  </select>
                </FilterRow>
                <FilterRow label={t("pipeline.filterSignedDoc")}>
                  <select value={fDocStatus} onChange={(e) => setFDocStatus(e.target.value)} className="input">
                    <option value="">{t("pipeline.filterAll")}</option>
                    <option value="pending">{t("pipeline.filterPending")}</option>
                    <option value="verified">{t("pipeline.filterVerified")}</option>
                    <option value="none">{t("pipeline.filterNoDoc")}</option>
                  </select>
                </FilterRow>
                <FilterRow label={t("pipeline.filterAccommodation")}>
                  <select value={fAccommodation} onChange={(e) => setFAccommodation(e.target.value)} className="input">
                    <option value="">{t("pipeline.filterAll")}</option>
                    <option value="yes">{t("pipeline.filterNeeded")}</option>
                    <option value="no">{t("pipeline.filterNotNeeded")}</option>
                  </select>
                </FilterRow>
                <FilterRow label={t("pipeline.filterElearning")}>
                  <select value={fElearning} onChange={(e) => setFElearning(e.target.value)} className="input">
                    <option value="">{t("pipeline.filterAll")}</option>
                    <option value="yes">{t("pipeline.filterEnabled")}</option>
                    <option value="no">{t("pipeline.filterDisabled")}</option>
                  </select>
                </FilterRow>
              </div>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tabs.map((tb) => {
            const active = tab === tb;
            const label =
              tb === "all"
                ? t("pipeline.tabAll")
                : tb === "not_interested"
                  ? t("pipeline.tabNotInterested")
                  : parcoursFilter === "all"
                    ? tb
                    : stageLabel(parcoursFilter, tb);
            return (
              <button
                key={tb}
                onClick={() => setTab(tb)}
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
                  {counts[tb] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List (scrollable so long lists don't push the page) */}
      <div className="mb-2 flex items-center justify-between px-1 text-xs text-ink-400">
        <span>
          {t("pipeline.listCount", {
            visible: visible.length,
            total: leads.length,
            plural: leads.length === 1 ? "" : "s",
          })}
        </span>
      </div>
      <div className="card max-h-[60vh] min-h-[160px] overflow-y-auto">
        {leads.length === 0 ? (
          <p className="p-10 text-center text-ink-400">{t("pipeline.emptyGlobal")}</p>
        ) : visible.length === 0 ? (
          <p className="p-10 text-center text-ink-400">{t("pipeline.emptyFiltered")}</p>
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
                  {l.cancelled_at ? (
                    <span className="badge bg-red-50 text-red-700">
                      {t("pipeline.drawer.cancelledBadge")}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
                  {l.profession || "–"}
                  {l.institution ? ` · ${l.institution}` : ""}
                </p>
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-medium text-ink-700">
                  {l.trainings?.title[lang] ?? l.trainings?.title.fr ?? l.training_title_snapshot ?? "–"}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-400">
                  {l.trainings?.city ?? ""}
                </p>
              </div>
              <div className="flex items-center justify-end gap-3.5">
                <span className="hidden items-center gap-1.5 text-xs text-ink-600 md:inline-flex">
                  <i className={`h-2 w-2 rounded-full ${INT_DOT[l.interest]}`} />
                  {t(INTEREST_KEY[l.interest])}
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
        aria-label={t("pipeline.drawerAriaLabel")}
        className={`fixed right-0 top-0 z-50 flex h-screen w-[524px] max-w-[94vw] flex-col bg-white shadow-2xl transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        } motion-reduce:transition-none`}
      >
        {drawerLead ? (
          <LeadDrawer
            key={drawerLead.id}
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
  const t = useT();
  const { lang } = useLang();
  const [note, setNote] = useState("");
  const parcours = normalizeParcours(lead);
  const stages = stagesFor(parcours);
  const idx = stages.indexOf(lead.stage);
  const last = stages.length - 1;
  const pct = idx <= 0 ? 0 : idx >= last ? 100 : (idx / last) * 100;
  const advance = advanceLabelFor(parcours, lead.stage);
  // Bootcamp refund gate (SOP): the label + target depend on waiver/attendance.
  const advanceTarget = resolveAdvance(parcours, lead.stage, {
    attended: lead.attended,
    cautionWaived: lead.caution_waived,
  });
  const isBootcampRefund = parcours === "bootcamp" && lead.stage === "confirmed";
  const advanceText = isBootcampRefund
    ? advanceTarget === "deposit_refunded"
      ? t("pipeline.drawer.depositRefundedShort")
      : lead.caution_waived
        ? t("pipeline.drawer.markDoneShort")
        : t("pipeline.drawer.closeDepositKept")
    : advance;
  const training = lead.trainings;
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

  // Stage-specific gates + guidance.
  const help = STAGE_HELP[parcours][lead.stage]?.[lang];
  const isEligibilityGate = parcours === "bootcamp" && lead.stage === "prerequisites";
  const isElearningGate = parcours === "helpmesee" && lead.stage === "elearning_check";

  // Per-step confirmation: normal steps require the admin to tick the step's
  // milestone before "advance" enables — a real checklist. Real gates
  // (eligibility, e-learning) use their own condition instead.
  const [stepChecked, setStepChecked] = useState(false);
  const [contractApproved, setContractApproved] = useState(false);
  useEffect(() => {
    setStepChecked(false);
    setContractApproved(false);
  }, [lead.id, lead.stage]);
  const advanceEnabled = isElearningGate
    ? lead.elearning_completed
    : parcours === "bootcamp" && lead.stage === "pre_registration"
      ? stepChecked || lead.caution_waived
      : stepChecked;

  // Eligibility step: auto-match the contract by course (a template whose
  // course_ids include this trainee's course), else the global default. The DB
  // trigger applies the same match atomically when the trainee advances.
  const matchedTemplate = isEligibilityGate
    ? (templates.find((tt) => tt.course_ids?.includes(lead.training_id ?? "")) ??
        templates.find((tt) => tt.is_default) ??
        null)
    : null;

  // Communications timeline: emails recorded on each stage transition, newest first.
  const emails = [...(lead.email_log ?? [])].sort((a, b) =>
    b.sent_at.localeCompare(a.sent_at),
  );

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
            {lead.cancelled_at ? (
              <span className="badge bg-red-50 text-red-700">
                {t("pipeline.drawer.cancelledBadge")}
              </span>
            ) : null}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-0.5 text-xl leading-none text-ink-400 hover:bg-ink-50 hover:text-ink-700"
            aria-label={t("pipeline.drawer.close")}
          >
            ✕
          </button>
        </div>
        <p className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1 text-[13px] text-ink-500">
          <span>{lead.email}</span>
          {lead.phone ? <span>· {lead.phone}</span> : null}
          <span>· {lead.country || "–"}</span>
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
            {t("pipeline.drawer.workflow")}
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
              {t("pipeline.drawer.lmsProvisioned")} · {lead.lms_user_id}
            </p>
          ) : null}

          {/* ---- Current step: meaning · waiting-for · confirm control ---- */}
          {help ? (
            <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/40 p-4">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-brand-600">
                {t("pipeline.drawer.currentStep")} · {stageLabel(parcours, lead.stage)}
              </p>
              <p className="text-[13px] text-ink-700">{help.what}</p>
              <p className="mt-2 text-[12px] text-ink-500">
                <span className="font-semibold text-ink-600">{t("pipeline.drawer.waitingFor")}</span> {help.waitingFor}
              </p>

              {/* HelpMeSee e-learning HARD GATE toggle */}
              {isElearningGate ? (
                <button
                  onClick={() => run(() => setElearningCompleted(lead.id, !lead.elearning_completed))}
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                    lead.elearning_completed
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {lead.elearning_completed ? t("pipeline.drawer.elearningVerified") : t("pipeline.drawer.markElearningVerified")}
                </button>
              ) : null}

              {/* Bootcamp pré-inscription: caution waiver exception */}
              {parcours === "bootcamp" && lead.stage === "pre_registration" ? (
                <button
                  onClick={() => run(() => setCautionWaived(lead.id, !lead.caution_waived))}
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                    lead.caution_waived ? "bg-amber-50 text-amber-700" : "bg-ink-100 text-ink-500"
                  }`}
                  title={t("pipeline.drawer.depositWaiverTitle")}
                >
                  {lead.caution_waived ? t("pipeline.drawer.depositWaivedException") : t("pipeline.drawer.depositRequired")}
                </button>
              ) : null}

              {/* Bootcamp confirmé: attendance gates the refund */}
              {parcours === "bootcamp" && lead.stage === "confirmed" ? (
                <button
                  onClick={() => run(() => setAttended(lead.id, !lead.attended))}
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                    lead.attended ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500"
                  }`}
                  title={t("pipeline.drawer.attendanceTitle")}
                >
                  {lead.attended ? t("pipeline.drawer.attendedConfirmed") : t("pipeline.drawer.attendanceNotConfirmed")}
                </button>
              ) : null}

              {/* Eligibility: auto-matched contract — preview + approve */}
              {isEligibilityGate ? (
                <div className="mt-3 rounded-lg border border-ink-100 bg-white p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
                    {t("pipeline.drawer.contractAutoTitle")}
                  </p>
                  {matchedTemplate ? (
                    <>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Icon name="clipboard-check" className="h-4 w-4 text-brand-600" />
                        <span className="text-[13px] font-semibold text-ink-900">
                          {matchedTemplate.name}
                        </span>
                        {matchedTemplate.is_default ? (
                          <span className="badge bg-ink-100 text-ink-500">{t("pipeline.drawer.contractDefault")}</span>
                        ) : (
                          <span className="badge bg-emerald-50 text-emerald-700">
                            {t("pipeline.drawer.contractMatching")}
                          </span>
                        )}
                      </div>
                      {publicBase && matchedTemplate.file_url ? (
                        <a
                          href={`${publicBase}/storage/v1/object/public/contracts/${matchedTemplate.file_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-ghost mt-2 !py-1.5 !text-xs"
                        >
                          {t("pipeline.drawer.previewContract")}
                        </a>
                      ) : (
                        <p className="mt-1 text-[11px] text-ink-400">
                          {t("pipeline.drawer.noFilePreview")}
                        </p>
                      )}
                      <label className="mt-2.5 flex items-start gap-2 text-[13px] text-ink-700">
                        <input
                          type="checkbox"
                          checked={contractApproved}
                          onChange={(e) => setContractApproved(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span>{t("pipeline.drawer.contractApproveLabel")}</span>
                      </label>
                    </>
                  ) : (
                    <p className="mt-1.5 text-[12px] text-red-600">
                      {t("pipeline.drawer.noContractAvailable")}
                    </p>
                  )}
                </div>
              ) : null}

              {/* Confirmation checkbox for normal (non-gate) steps */}
              {!isEligibilityGate && !isElearningGate && advance ? (
                <label className="mt-3 flex items-start gap-2 text-[13px] text-ink-700">
                  <input
                    type="checkbox"
                    checked={stepChecked}
                    onChange={(e) => setStepChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>{t("pipeline.drawer.confirmMilestone", { milestone: help.waitingFor })}</span>
                </label>
              ) : null}

              {/* Primary action */}
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                {isEligibilityGate ? (
                  <>
                    <button
                      onClick={() => run(() => verifyEligibility(lead.id, true))}
                      disabled={!matchedTemplate || !contractApproved}
                      title={
                        !matchedTemplate
                          ? t("pipeline.drawer.eligibilityOkNoContract")
                          : !contractApproved
                            ? t("pipeline.drawer.eligibilityOkNeedApproval")
                            : undefined
                      }
                      className="btn-primary !py-2 !text-sm disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t("pipeline.drawer.eligibilityOk")} →
                    </button>
                    <button
                      onClick={() => run(() => verifyEligibility(lead.id, false))}
                      className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      {t("pipeline.drawer.eligibilityNotOk")}
                    </button>
                  </>
                ) : advance ? (
                  <button
                    onClick={() => run(() => advanceStage(lead.id, lead.stage, parcours))}
                    disabled={!advanceEnabled}
                    title={!advanceEnabled ? t("pipeline.drawer.confirmFirstAbove") : undefined}
                    className="btn-primary !py-2 !text-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {advanceText} →
                  </button>
                ) : (
                  <span className="badge bg-emerald-50 text-emerald-700">
                    <Icon name="check" className="h-3.5 w-3.5" /> {t("pipeline.drawer.trackDone")}
                  </span>
                )}
              </div>

              {help.onAdvance ? (
                <p className="mt-2 text-[12px] text-ink-500">→ {help.onAdvance}</p>
              ) : null}
            </div>
          ) : null}

          {/* Secondary controls: interest · reminders · exit */}
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <select
              value={lead.interest}
              onChange={(e) => run(() => setInterest(lead.id, e.target.value as InterestLevel))}
              className="rounded-full border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-700"
            >
              {INTEREST_LEVELS.map((i) => (
                <option key={i} value={i}>
                  {t(INTEREST_KEY[i])}
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
              {lead.reminders_active ? t("pipeline.drawer.interestReminders") : t("pipeline.drawer.remindersOff")}
            </button>
            {lead.interest !== "not_interested" && !lead.cancelled_at ? (
              <button
                onClick={() => run(() => setNotInterested(lead.id))}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                title={t("pipeline.drawer.exitTitle")}
              >
                {t("pipeline.drawer.notInterested")}
              </button>
            ) : null}
            {/* Cancel / reinstate — admin only. Cancel is for a REGISTERED
                trainee who withdraws (distinct from "not interested"); no
                refund is implied (deposit handled off-platform per SOP). */}
            {isAdmin && !lead.cancelled_at ? (
              <button
                onClick={() => {
                  const reason = window.prompt(t("pipeline.drawer.cancelPrompt"));
                  if (reason === null) return; // dialog dismissed → abort
                  run(() => cancelRegistration(lead.id, reason));
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200"
                title={t("pipeline.drawer.cancelTitle")}
              >
                {t("pipeline.drawer.cancel")}
              </button>
            ) : null}
            {isAdmin && lead.cancelled_at ? (
              <button
                onClick={() => {
                  if (confirm(t("pipeline.drawer.reinstateConfirm")))
                    run(() => reinstateLead(lead.id));
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                {t("pipeline.drawer.reinstate")}
              </button>
            ) : null}
          </div>
        </div>

        {/* Session & logistique */}
        <div className="border-b border-ink-100 px-6 py-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">
            {t("pipeline.drawer.sessionLogistics")}
          </p>
          <dl className="grid grid-cols-[104px_1fr] gap-x-3 gap-y-1.5 text-[13px]">
            <dt className="text-ink-400">{t("pipeline.drawer.session")}</dt>
            <dd className="text-ink-700">
              {training?.title?.[lang] ?? training?.title?.fr ?? lead.training_title_snapshot ?? "–"}
            </dd>
            <dt className="text-ink-400">{t("pipeline.drawer.dates")}</dt>
            <dd className="text-ink-700">
              {training ? `${fmtRange(training.start_date, training.end_date)} · ${training.city}` : "–"}
            </dd>
            <dt className="text-ink-400">{t("pipeline.drawer.price")}</dt>
            <dd className="text-ink-700">
              {training
                ? parcours === "helpmesee"
                  ? `${euro(training.price_eur)} · ${t("pipeline.drawer.priceFoundation")}`
                  : `${euro(training.price_eur)} · ${t("pipeline.drawer.priceDeposit")} ${euro(training.deposit_eur)}`
                : "–"}
            </dd>
            <dt className="text-ink-400">{t("pipeline.drawer.diet")}</dt>
            <dd className="text-ink-700">{lead.dietary || "–"}</dd>
          </dl>
        </div>

        {/* Financement / sponsor — Bootcamp only (HelpMeSee is foundation-funded) */}
        {parcours === "bootcamp" ? (
        <div className="border-b border-ink-100 px-6 py-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">
            {t("pipeline.drawer.funding")}
          </p>
          {lead.funding === "sponsored" ? (
            <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50 px-3.5 py-3">
              {lead.sponsor_logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lead.sponsor_logo_url}
                  alt={lead.sponsor_name ?? "Sponsor"}
                  className="h-9 w-9 rounded-lg border border-violet-200 bg-white object-contain"
                />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-lg border border-violet-200 bg-white text-xs font-bold text-violet-700">
                  {(lead.sponsor_name ?? "SP").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-ink-900">
                  {lead.sponsor_name ?? t("pipeline.drawer.sponsoredFallback")}
                </p>
                <p className="text-xs text-violet-700">
                  {t("pipeline.drawer.sponsoredNote")}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 px-3.5 py-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 bg-white text-ink-500">
                <Icon name="clipboard-check" className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-ink-900">{t("pipeline.drawer.selfFunded")}</p>
                <p className="text-xs text-ink-500">
                  {t("pipeline.drawer.selfFundedNote")}
                  {training ? ` · ${euro(training.price_eur)}` : ""}
                </p>
              </div>
            </div>
          )}
        </div>
        ) : null}

        {/* Fondation (HelpMeSee only) */}
        {parcours === "helpmesee" ? (
          <div className="border-b border-ink-100 px-6 py-5">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">
              {t("pipeline.drawer.foundation")}
            </p>
            <dl className="grid grid-cols-[104px_1fr] gap-x-3 gap-y-1.5 text-[13px]">
              <dt className="text-ink-400">{t("pipeline.drawer.funding")}</dt>
              <dd className="text-ink-700">{t("pipeline.drawer.foundationFunding")}</dd>
              <dt className="text-ink-400">{t("pipeline.drawer.reference")}</dt>
              <dd className="text-ink-700">{lead.helpmesee_ref || "–"}</dd>
              <dt className="text-ink-400">{t("pipeline.drawer.coordinator")}</dt>
              <dd className="text-ink-700">{lead.coordinator || "–"}</dd>
            </dl>
          </div>
        ) : null}

        {/* Engagement contract + signed document — Bootcamp, only once the
            contract has been sent (pré-inscription / caution reçus). At the
            prérequis step the contract is just previewed + approved to send,
            so nothing is signed yet. */}
        {parcours === "bootcamp" &&
        ["pre_registration", "deposit_contract"].includes(lead.stage) ? (
          <>
        <div className="border-b border-ink-100 px-6 py-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">
            {t("pipeline.drawer.engagementContract")}
          </p>
          <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 px-3.5 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 bg-white text-ink-500">
              <Icon name="clipboard-check" className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-ink-900">
                {lead.contract_template?.name ?? t("pipeline.drawer.noContractYet")}
              </p>
              <p className="text-xs text-ink-500">
                {lead.contract_template
                  ? t("pipeline.drawer.contractFromTemplates")
                  : t("pipeline.drawer.contractAutoAttach")}
              </p>
            </div>
            {lead.contract_template?.file_url && publicBase ? (
              <a
                href={`${publicBase}/storage/v1/object/public/contracts/${lead.contract_template.file_url}`}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost !py-1.5 !text-xs"
              >
                {t("pipeline.drawer.view")}
              </a>
            ) : null}
          </div>
          {templates.length > 0 ? (
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-[11px] text-ink-500">{t("pipeline.drawer.template")}</span>
              <select
                value={lead.contract_template_id ?? ""}
                onChange={(e) => run(() => setLeadContractTemplate(lead.id, e.target.value))}
                className="rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs text-ink-700"
              >
                <option value="">{t("pipeline.drawer.noneOption")}</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                    {tpl.is_default ? t("pipeline.drawer.defaultSuffix") : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-ink-400">
              {t("pipeline.drawer.noTemplatesYet")}
            </p>
          )}
        </div>

        {/* Documents (the signed copy returned by the lead) */}
        <div className="border-b border-ink-100 px-6 py-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">
            {t("pipeline.drawer.signedDocument")}
          </p>
          <DocState lead={lead} />
        </div>
          </>
        ) : null}

        {/* Communications — the emails fired on each stage transition */}
        <div className="border-b border-ink-100 px-6 py-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">
            {t("pipeline.drawer.communications")}
          </p>
          {emails.length === 0 ? (
            <p className="text-[13px] text-ink-400">
              {t("pipeline.drawer.noEmailsYet")}
            </p>
          ) : (
            <div className="space-y-2">
              {emails.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2"
                >
                  <Icon name="mail" className="h-4 w-4 text-brand-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-ink-800">
                      {e.template ?? "email"}
                    </p>
                    <p className="text-[11px] text-ink-400">
                      {e.to_email} · {fmtDay(e.sent_at)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      e.status === "sent"
                        ? "bg-emerald-50 text-emerald-700"
                        : e.status === "failed"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {e.status ?? "queued"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="px-6 py-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">
            {t("pipeline.drawer.comments")}
          </p>
          <div className="space-y-3">
            {lead.notes ? (
              <div>
                <p className="mb-1 text-[11px] text-ink-400">{t("pipeline.drawer.fromRegistrant")}</p>
                <p className="rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-[13px] italic text-ink-600">
                  “{lead.notes}”
                </p>
              </div>
            ) : null}
            {chat.length === 0 && !lead.notes ? (
              <p className="text-[13px] text-ink-400">{t("pipeline.drawer.noNotesYet")}</p>
            ) : null}
            {chat.map((c) => (
              <div key={c.id}>
                <p className="mb-1 text-[11px] text-ink-400">
                  {fmtDay(c.created_at)} · {c.author ?? t("pipeline.drawer.staffFallback")}
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
          placeholder={t("pipeline.drawer.notePlaceholder")}
          className="input"
        />
        <button onClick={sendNote} className="btn-primary !py-2 !text-sm">
          {t("pipeline.drawer.send")}
        </button>
        {isAdmin ? (
          <button
            onClick={() => {
              if (confirm(t("pipeline.drawer.deleteTraineeConfirm", { name: `${lead.first_name} ${lead.last_name}` }))) {
                run(() => deleteLead(lead.id));
                onDeleted();
              }
            }}
            className="rounded-xl px-2.5 py-2 text-sm text-red-500 hover:bg-red-50"
            title={t("pipeline.drawer.adminOnly")}
            aria-label={t("pipeline.drawer.deleteTrainee")}
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
  const t = useT();
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
      ? { text: t("pipeline.doc.verifiedText"), pill: t("pipeline.doc.verifiedPill"), tone: "bg-emerald-50 text-emerald-700" }
      : {
          text: t("pipeline.doc.pendingText", { channel: doc.sign_channel ?? "manual" }),
          pill: t("pipeline.doc.pendingPill"),
          tone: "bg-amber-50 text-amber-700",
        }
    : confirmedOrLater
      ? { text: t("pipeline.doc.nonePastStageText"), pill: t("pipeline.doc.nonePill"), tone: "bg-ink-100 text-ink-500" }
      : lead.stage === "lead"
        ? { text: t("pipeline.doc.notSentText"), pill: t("pipeline.doc.notSentPill"), tone: "bg-ink-100 text-ink-500" }
        : { text: t("pipeline.doc.awaitingText"), pill: t("pipeline.doc.awaitingPill"), tone: "bg-amber-50 text-amber-700" };

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
          <p className="text-[13px] font-semibold text-ink-900">{t("pipeline.doc.title")}</p>
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
            {t("pipeline.doc.viewSigned")}
          </button>
          {!doc.verified ? (
            <button onClick={verify} className="btn-primary !py-1.5 !text-xs">
              {t("pipeline.doc.verifyConfirm")}
            </button>
          ) : null}
        </div>
      ) : !confirmedOrLater ? (
        /* No document → staff uploads the signed doc the lead returned */
        <div className="mt-2.5">
          <label className="mb-1 block text-[11px] font-medium text-ink-500">
            {t("pipeline.doc.uploadLabel")}
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
              {t("pipeline.doc.uploadButton")}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-ink-400">
            {t("pipeline.doc.onlineSigningNote")}
          </p>
        </div>
      ) : null}

      {err ? <p className="mt-2 text-xs text-red-600">{err}</p> : null}
    </div>
  );
}
