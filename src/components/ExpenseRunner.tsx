"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { ExpenseUploader } from "./ExpenseUploader";
import {
  CATEGORY_KEYS,
  CATEGORY_COLUMN,
  MATRICE_HEADERS,
  type AnalyzeResult,
  type ProcessedExpense,
  type CategoryKey,
} from "@/lib/expenses/types";

const categoryLabel = (k: string | null) =>
  k && k in CATEGORY_COLUMN ? CATEGORY_COLUMN[k as CategoryKey].label : k || "–";

// Matrice header text -> the category key that lands in that column (for the
// 10 category-amount headers). Headers with no entry (Etude, Kilomètres) are
// never populated by the extraction pipeline today.
const HEADER_TO_CATEGORY: Partial<Record<string, CategoryKey>> = {};
for (const k of CATEGORY_KEYS) HEADER_TO_CATEGORY[CATEGORY_COLUMN[k].label] = k;

type Phase = "setup" | "analyzing" | "review" | "committing" | "done";

type PreviewRow = {
  sheetName: string;
  traveler: string;
  date: string | null;
  vendor: string | null;
  category: string | null;
  amountEUR: number | null;
  vat: number | null;
  currency: string | null;
  location: string | null;
};
type PreviewData = { rows: PreviewRow[]; sheets: string[]; total: number; found: boolean; error?: string };

const eur = (n: number | null | undefined) =>
  n == null ? "–" : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

export function ExpenseRunner() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [savedMaster, setSavedMaster] = useState(false);
  const [extractionReady, setExtractionReady] = useState(true);
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [useSaved, setUseSaved] = useState(false);
  const [receipts, setReceipts] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [traveler, setTraveler] = useState("");
  const [tripHint, setTripHint] = useState("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [committedName, setCommittedName] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sheetSynced, setSheetSynced] = useState<boolean | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState<string | null>(null);
  const masterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/expenses/master")
      .then((r) => r.json())
      .then((d) => {
        setSavedMaster(Boolean(d.savedMaster));
        setUseSaved(Boolean(d.savedMaster));
        setExtractionReady(d.extractionReady !== false);
      })
      .catch(() => {});
  }, []);

  const masterReady = masterFile != null || (useSaved && savedMaster);

  // Preview the selected master (DB default or uploaded) so it shows side-by-side.
  useEffect(() => {
    let cancelled = false;
    async function loadPreview() {
      if (!(masterFile != null || (useSaved && savedMaster))) {
        setPreview(null);
        return;
      }
      setPreviewLoading(true);
      try {
        const fd = new FormData();
        if (masterFile) fd.append("master", masterFile);
        else fd.append("useSaved", "true");
        const res = await fetch("/api/expenses/preview", { method: "POST", body: fd });
        const d = (await res.json()) as PreviewData;
        if (!cancelled) setPreview(d);
      } catch {
        if (!cancelled) setPreview(null);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }
    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [masterFile, useSaved, savedMaster]);
  const canAnalyze = masterReady && receipts.length > 0 && description.trim().length > 0;

  async function analyze() {
    setError(null);
    setPhase("analyzing");
    try {
      const fd = new FormData();
      if (masterFile) fd.append("master", masterFile);
      else fd.append("useSaved", "true");
      receipts.forEach((f) => fd.append("files", f));
      fd.append("description", description);
      if (traveler.trim()) fd.append("traveler", traveler.trim());
      if (tripHint.trim()) fd.append("tripHint", tripHint.trim());
      const res = await fetch("/api/expenses/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'analyse.");
      setResult(data as AnalyzeResult);
      setPhase("review");
    } catch (e) {
      setError((e as Error).message);
      setPhase("setup");
    }
  }

  function patch(id: string, changes: Partial<ProcessedExpense>) {
    setResult((prev) =>
      prev ? { ...prev, expenses: prev.expenses.map((e) => (e.id === id ? { ...e, ...changes } : e)) } : prev,
    );
  }

  async function commit() {
    if (!result) return;
    setError(null);
    setPhase("committing");
    try {
      const fd = new FormData();
      if (masterFile) fd.append("master", masterFile);
      else fd.append("useSaved", "true");
      fd.append("expenses", JSON.stringify(result.expenses));
      fd.append("employeeName", "Nathalie");
      fd.append("runId", result.runId);
      fd.append("fileName", result.masterFileName || "Matrice LM_0226_rembt Frais.xlsx");
      const res = await fetch("/api/expenses/commit", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Échec de l'écriture.");
      setSheetSynced(Boolean(data.sheetSynced));
      setCommittedName(result.masterFileName || "Matrice LM_0226_rembt Frais.xlsx");
      setPhase("done");
    } catch (e) {
      setError((e as Error).message);
      setPhase("review");
    }
  }

  async function clearAllData() {
    setClearing(true);
    setClearMessage(null);
    try {
      const res = await fetch("/api/expenses/clear", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Échec de la suppression.");
      const sheetPart = data.sheetCleared ? "Google Sheet vidé." : "Google Sheet non vidé (vérifier la config).";
      setClearMessage(`${data.deletedRuns ?? 0} lot(s) supprimé(s) de la base · ${sheetPart}`);
      setConfirmClear(false);
    } catch (e) {
      setClearMessage((e as Error).message);
    } finally {
      setClearing(false);
    }
  }

  function reset() {
    setPhase("setup");
    setReceipts([]);
    setResult(null);
    setDescription("");
    setTraveler("");
    setTripHint("");
    setCommittedName(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {clearMessage && <span className="text-xs text-ink-500">{clearMessage}</span>}
        <button
          type="button"
          onClick={() => setConfirmClear(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
          title="Supprime les données enregistrées dans la base ET vide le Google Sheet partagé (téléchargez le fichier avant, si besoin)"
        >
          <Icon name="clipboard-check" className="h-4 w-4" />
          Effacer toutes les données
        </button>
        <a
          href="/api/expenses/download-sheet"
          className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
          title="Télécharge l'état actuel du Google Sheet partagé (tout ce qui a été commité par tout le monde)"
        >
          <Icon name="clipboard-check" className="h-4 w-4" />
          Télécharger le Google Sheet (.xlsx)
        </a>
      </div>
      {confirmClear && (
        <ConfirmModal
          title="Effacer toutes les données de dépenses ?"
          message="Ceci supprime définitivement l'historique des lots dans la base de données ET vide toutes les lignes du Google Sheet partagé (les en-têtes et le total cumulé restent). Le fichier maître Excel n'est pas touché. Téléchargez d'abord une copie si vous n'en avez pas encore — cette action est irréversible pour tout le monde utilisant ce Sheet."
          confirmLabel={clearing ? "Suppression…" : "Oui, tout effacer"}
          disabled={clearing}
          onConfirm={clearAllData}
          onCancel={() => setConfirmClear(false)}
        />
      )}
      {!extractionReady && (
        <Banner tone="amber">
          La clé d&apos;extraction IA (OPENAI_API_KEY ou ANTHROPIC_API_KEY) n&apos;est pas configurée sur ce
          serveur, l&apos;analyse ne fonctionnera pas tant qu&apos;une clé n&apos;est pas ajoutée.
        </Banner>
      )}
      {error && <Banner tone="red">{error}</Banner>}

      {(phase === "setup" || phase === "analyzing") && (
        <div className="grid gap-6 xl:grid-cols-2">
          <SetupCard
            savedMaster={savedMaster}
            useSaved={useSaved}
            setUseSaved={setUseSaved}
            masterFile={masterFile}
            setMasterFile={setMasterFile}
            masterInputRef={masterInputRef}
            receipts={receipts}
            setReceipts={setReceipts}
            description={description}
            setDescription={setDescription}
            traveler={traveler}
            setTraveler={setTraveler}
            tripHint={tripHint}
            setTripHint={setTripHint}
            canAnalyze={canAnalyze}
            analyzing={phase === "analyzing"}
            onAnalyze={analyze}
          />
          <MasterPreview
            preview={preview}
            loading={previewLoading}
            title="Aperçu du fichier maître (par défaut)"
          />
        </div>
      )}

      {phase === "review" && result && (
        <div className="space-y-6">
          <ReviewTable result={result} onPatch={patch} onCommit={commit} onBack={reset} />
          <MasterPreview
            preview={preview}
            loading={previewLoading}
            title="Fichier maître actuel — les lignes validées s'y ajouteront"
          />
        </div>
      )}
      {phase === "committing" && <Progress label="Envoi des dépenses vers le Google Sheet en cours…" />}
      {phase === "done" && (
        <DoneCard
          name={committedName}
          total={result?.grandTotalEUR ?? 0}
          sheetSynced={sheetSynced}
          onReset={reset}
        />
      )}
    </div>
  );
}

function CategoryBreakdown({ expenses }: { expenses: ProcessedExpense[] }) {
  const totals = new Map<string, number>();
  for (const e of expenses) {
    const key = e.category ?? "misc";
    totals.set(key, (totals.get(key) ?? 0) + (e.amountEUR ?? 0));
  }
  const rows = [...totals.entries()]
    .map(([key, total]) => ({ key, total, label: categoryLabel(key) }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);
  const max = rows[0]?.total ?? 0;

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <div className="text-sm font-semibold text-ink-900">Répartition par catégorie</div>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-ink-400">
          Aucun montant exploitable pour l&apos;instant (dépenses en attente de vérification/montant).
        </p>
      ) : (
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-3 text-xs">
            <div className="w-40 shrink-0 truncate whitespace-pre-line text-ink-600" title={r.label}>{r.label}</div>
            <div className="h-4 flex-1 overflow-hidden rounded bg-ink-50">
              <div
                className="h-full rounded bg-brand-500"
                style={{ width: `${Math.max(4, (r.total / max) * 100)}%` }}
              />
            </div>
            <div className="w-20 shrink-0 text-right font-medium text-ink-900">{eur(r.total)}</div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  disabled,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  disabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-ink-200 bg-white p-5 shadow-xl">
        <div className="text-sm font-semibold text-ink-900">{title}</div>
        <p className="mt-2 text-xs text-ink-600">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Banner({ tone, children }: { tone: "amber" | "red" | "green"; children: React.ReactNode }) {
  const map = {
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  } as const;
  return <div className={`rounded-xl border px-4 py-2.5 text-xs font-medium ${map[tone]}`}>{children}</div>;
}

function Progress({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white px-5 py-8">
      <Icon name="clipboard-check" className="h-5 w-5 animate-pulse text-brand-600" />
      <span className="text-sm font-medium text-ink-700">{label}</span>
    </div>
  );
}

function SetupCard(props: {
  savedMaster: boolean;
  useSaved: boolean;
  setUseSaved: (v: boolean) => void;
  masterFile: File | null;
  setMasterFile: (f: File | null) => void;
  masterInputRef: React.RefObject<HTMLInputElement | null>;
  receipts: File[];
  setReceipts: (f: File[]) => void;
  description: string;
  setDescription: (v: string) => void;
  traveler: string;
  setTraveler: (v: string) => void;
  tripHint: string;
  setTripHint: (v: string) => void;
  canAnalyze: boolean;
  analyzing: boolean;
  onAnalyze: () => void;
}) {
  const p = props;
  return (
    <div className="space-y-5 rounded-2xl border border-ink-200 bg-white p-5">
      <div>
        <div className="text-sm font-semibold text-ink-900">1 · Fichier maître (Matrice de Nathalie)</div>
        <p className="mt-0.5 text-xs text-ink-400">
          Les dépenses seront ajoutées dans ce fichier (une feuille par voyage). Le fichier n&apos;est jamais remplacé.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {p.savedMaster && (
            <label className="flex items-center gap-2 text-xs font-medium text-ink-700">
              <input type="checkbox" checked={p.useSaved} onChange={(e) => p.setUseSaved(e.target.checked)} />
              Utiliser le dernier fichier enregistré
            </label>
          )}
          <button
            type="button"
            onClick={() => p.masterInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
          >
            <Icon name="clipboard-check" className="h-4 w-4" />
            {p.masterFile ? p.masterFile.name : "Importer le fichier Matrice (.xlsx)"}
          </button>
          <input
            ref={p.masterInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              p.setMasterFile(f);
              if (f) p.setUseSaved(false);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-ink-900">2 · Justificatifs du lot</div>
        <div className="mt-2">
          <ExpenseUploader onFiles={(f) => p.setReceipts([...p.receipts, ...f])} disabled={p.analyzing} />
        </div>
        {p.receipts.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {p.receipts.map((f, i) => (
              <li key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-1 text-xs text-ink-600">
                {f.name}
                <button
                  type="button"
                  onClick={() => p.setReceipts(p.receipts.filter((_, j) => j !== i))}
                  className="text-ink-400 hover:text-red-600"
                  aria-label="Retirer"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="text-sm font-semibold text-ink-900">3 · Contexte du dépôt</div>
        <p className="mt-0.5 text-xs text-ink-400">
          Décrivez le lot (voyageur + objet), sert à renseigner le voyageur/l&apos;objet quand ils sont absents des justificatifs. L&apos;IA n&apos;invente rien d&apos;autre.
        </p>
        <textarea
          value={p.description}
          onChange={(e) => p.setDescription(e.target.value)}
          rows={2}
          placeholder="Ex : Frais de Cristina Rocchi, déplacement Venise ↔ Strasbourg, mars 2026."
          className="mt-2 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
        />
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input
            value={p.traveler}
            onChange={(e) => p.setTraveler(e.target.value)}
            placeholder="Voyageur (optionnel)"
            className="rounded-lg border border-ink-200 px-3 py-2 text-sm"
          />
          <input
            value={p.tripHint}
            onChange={(e) => p.setTripHint(e.target.value)}
            placeholder="Voyage / lieu (optionnel, ex : Venise)"
            className="rounded-lg border border-ink-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-ink-100 pt-4">
        <button
          type="button"
          disabled={!p.canAnalyze || p.analyzing}
          onClick={p.onAnalyze}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
            {p.analyzing ? (
              <span key="spinner" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Icon key="icon" name="clipboard-check" className="h-4 w-4" />
            )}
          </span>
          <span>{p.analyzing ? "Analyse en cours…" : "Analyser les justificatifs"}</span>
        </button>
        {!p.canAnalyze && !p.analyzing && (
          <span className="text-xs text-ink-400">Fichier maître + justificatifs + description requis.</span>
        )}
      </div>
    </div>
  );
}

function ReviewTable({
  result,
  onPatch,
  onCommit,
  onBack,
}: {
  result: AnalyzeResult;
  onPatch: (id: string, c: Partial<ProcessedExpense>) => void;
  onCommit: () => void;
  onBack: () => void;
}) {
  const active = result.expenses.filter((e) => !e.duplicateOfId && !e.idempotentSkip);
  const excluded = result.expenses.filter((e) => e.duplicateOfId || e.idempotentSkip);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-ink-600">
          <span className="font-semibold text-ink-900">{active.length}</span> dépense(s) à enregistrer ·{" "}
          <span className="font-semibold text-ink-900">{eur(result.grandTotalEUR)}</span> · {result.groups.length} feuille(s)
          {excluded.length > 0 && <> · {excluded.length} ignorée(s) (doublons/déjà traités)</>}
        </div>
        <div className="flex gap-2">
          <button onClick={onBack} className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50">
            Recommencer
          </button>
          <button
            onClick={onCommit}
            disabled={active.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Icon name="clipboard-check" className="h-4 w-4" />
            Valider &amp; générer le fichier
          </button>
        </div>
      </div>

      <CategoryBreakdown expenses={active} />

      {result.alerts.length > 0 && (
        <Banner tone="amber">
          <div className="font-semibold">Alertes à vérifier</div>
          <ul className="mt-1 list-disc pl-4">
            {result.alerts.slice(0, 12).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Banner>
      )}

      <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-[2100px] text-left text-xs">
          <thead className="bg-ink-50 text-ink-500">
            <tr>
              <th className="px-2.5 py-2 font-semibold">Justificatif</th>
              <th className="px-2.5 py-2 font-semibold">Catégorie</th>
              {MATRICE_HEADERS.map((h) => (
                <th key={h} className="whitespace-pre-line px-2.5 py-2 font-semibold">{h}</th>
              ))}
              <th className="px-2.5 py-2 font-semibold">docKey</th>
              <th className="px-2.5 py-2 font-semibold">État</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {active.map((e) => (
              <tr key={e.id} className={e.needsReview ? "bg-amber-50/50" : ""}>
                <td className="px-2.5 py-2 text-ink-500">{e.sourceFile}</td>
                <td className="px-2.5 py-2">
                  <select
                    value={e.category ?? ""}
                    onChange={(ev) => onPatch(e.id, { category: (ev.target.value || null) as CategoryKey | null })}
                    className="rounded border border-ink-200 px-1.5 py-1"
                  >
                    <option value="">– à choisir –</option>
                    {CATEGORY_KEYS.map((k) => (
                      <option key={k} value={k}>{CATEGORY_COLUMN[k].label}</option>
                    ))}
                  </select>
                </td>
                {MATRICE_HEADERS.map((h) => {
                  if (h === "Date") {
                    return (
                      <td key={h} className="px-2.5 py-2">
                        <input
                          value={e.issueDateLabel || ""}
                          onChange={(ev) => onPatch(e.id, { issueDateLabel: ev.target.value })}
                          className="w-24 rounded border border-ink-200 px-1.5 py-1"
                        />
                      </td>
                    );
                  }
                  if (h === "Etude") {
                    return (
                      <td key={h} className="px-2.5 py-2">
                        <input
                          value={e.etude || ""}
                          onChange={(ev) => onPatch(e.id, { etude: ev.target.value || null })}
                          placeholder="—"
                          title="Non extrait par l'IA — saisie manuelle"
                          className="w-24 rounded border border-ink-200 px-1.5 py-1"
                        />
                      </td>
                    );
                  }
                  if (h === "Objet") {
                    return (
                      <td key={h} className="px-2.5 py-2">
                        <input
                          value={e.purpose || ""}
                          onChange={(ev) => onPatch(e.id, { purpose: ev.target.value })}
                          className="w-36 rounded border border-ink-200 px-1.5 py-1"
                        />
                      </td>
                    );
                  }
                  if (h === "Lieu du déplacement") {
                    return (
                      <td key={h} className="px-2.5 py-2">
                        <input
                          value={e.location || ""}
                          onChange={(ev) => onPatch(e.id, { location: ev.target.value })}
                          className="w-32 rounded border border-ink-200 px-1.5 py-1"
                        />
                      </td>
                    );
                  }
                  if (h === "TVA récupérable") {
                    return (
                      <td key={h} className="px-2.5 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={e.vatRecoverable ?? ""}
                          onChange={(ev) => onPatch(e.id, { vatRecoverable: ev.target.value === "" ? null : Number(ev.target.value) })}
                          className="w-16 rounded border border-ink-200 px-1.5 py-1"
                        />
                      </td>
                    );
                  }
                  if (h === "Kilomètres") {
                    return (
                      <td key={h} className="px-2.5 py-2">
                        <input
                          type="number"
                          step="0.1"
                          value={e.distanceKm ?? ""}
                          onChange={(ev) => onPatch(e.id, { distanceKm: ev.target.value === "" ? null : Number(ev.target.value) })}
                          title="Distance réelle (si indiquée sur le justificatif) — calcule le remboursement via le barème du fichier maître"
                          className="w-16 rounded border border-ink-200 px-1.5 py-1"
                        />
                      </td>
                    );
                  }
                  if (h === "Devise de dépense") {
                    return (
                      <td key={h} className="px-2.5 py-2">
                        <input
                          value={e.originalCurrency || ""}
                          onChange={(ev) => onPatch(e.id, { originalCurrency: ev.target.value || null })}
                          className="w-16 rounded border border-ink-200 px-1.5 py-1"
                        />
                      </td>
                    );
                  }
                  if (h === "Total") {
                    return (
                      <td key={h} className="px-2.5 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={e.amountEUR ?? ""}
                          onChange={(ev) => onPatch(e.id, { amountEUR: ev.target.value === "" ? null : Number(ev.target.value) })}
                          className="w-24 rounded border border-ink-200 px-1.5 py-1"
                        />
                        {e.fx && (
                          <div className="text-[10px] text-ink-400" title={`Taux ${e.fx.rate} ${e.fx.originalCurrency}/EUR, ${e.fx.source} ${e.fx.rateDate}`}>
                            @ {e.fx.rate} ({e.fx.source})
                          </div>
                        )}
                      </td>
                    );
                  }
                  // The 10 category-amount columns (Billet d'avion .. Divers,
                  // including Remboursement du kilométrage for mileage).
                  const owningCategory = HEADER_TO_CATEGORY[h];
                  const isThisRowsCategory = owningCategory && e.category === owningCategory;
                  return (
                    <td key={h} className="px-2.5 py-2 text-center">
                      {isThisRowsCategory ? (
                        <span className="font-medium text-ink-900">{eur(e.amountEUR)}</span>
                      ) : (
                        <span className="text-ink-300">–</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-2.5 py-2 font-mono text-[10px] text-ink-400">{e.docKey}</td>
                <td className="px-2.5 py-2">
                  {e.needsReview ? (
                    <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700" title={e.reviewReasons.join(" · ")}>
                      à vérifier
                    </span>
                  ) : (
                    <span className="inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">ok</span>
                  )}
                </td>
              </tr>
            ))}
            {excluded.map((e) => (
              <tr key={e.id} className="bg-ink-50/60 text-ink-400">
                <td className="px-2.5 py-2">{e.sourceFile}</td>
                <td className="px-2.5 py-2">{categoryLabel(e.category)}</td>
                <td className="px-2.5 py-2">{e.issueDateLabel || "–"}</td>
                <td className="px-2.5 py-2">{e.purpose || "–"}</td>
                <td className="px-2.5 py-2">{e.location || "–"}</td>
                <td className="px-2.5 py-2" colSpan={MATRICE_HEADERS.length - 3}>
                  <span className="font-medium">{eur(e.amountEUR)}</span> ·{" "}
                  {e.duplicateOfId ? "doublon détecté dans ce lot, compté une seule fois" : "déjà présent dans le fichier maître (traité précédemment)"}
                  — vérifiez puis incluez si vous voulez quand même l'écrire à nouveau.
                </td>
                <td className="px-2.5 py-2 font-mono text-[10px]">{e.docKey}</td>
                <td className="px-2.5 py-2">
                  <button
                    type="button"
                    onClick={() => onPatch(e.id, { duplicateOfId: null, idempotentSkip: false })}
                    className="inline-block whitespace-nowrap rounded bg-ink-200 px-1.5 py-0.5 text-[10px] font-semibold text-ink-700 hover:bg-ink-300"
                    title="Ce justificatif a été détecté comme déjà traité ou doublon. Cliquez pour l'inclure quand même dans l'écriture."
                  >
                    inclure quand même
                  </button>
                </td>
              </tr>
            ))}
            {active.length === 0 && excluded.length === 0 && (
              <tr>
                <td colSpan={MATRICE_HEADERS.length + 4} className="px-2.5 py-8 text-center text-ink-400">
                  Aucun justificatif exploitable dans ce lot.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {result.skipped.length > 0 && (
        <div className="text-xs text-ink-400">
          Fichiers ignorés : {result.skipped.map((s) => `${s.file} (${s.reason})`).join(" · ")}
        </div>
      )}
    </div>
  );
}

function MasterPreview({
  preview,
  loading,
  title,
}: {
  preview: PreviewData | null;
  loading: boolean;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-ink-900">{title}</div>
        {preview?.found && !preview.error ? (
          <span className="text-xs text-ink-500">
            {preview.rows.length} ligne(s) · {eur(preview.total)}
          </span>
        ) : null}
      </div>
      {loading ? (
        <p className="mt-3 text-xs text-ink-400">Chargement de l&apos;aperçu…</p>
      ) : !preview || !preview.found ? (
        <p className="mt-3 text-xs text-ink-400">
          Aucun fichier maître enregistré. Importez la Matrice, elle sera enregistrée et proposée par défaut.
        </p>
      ) : preview.error ? (
        <p className="mt-3 text-xs text-red-600">{preview.error}</p>
      ) : preview.rows.length === 0 ? (
        <p className="mt-3 text-xs text-ink-400">
          Le fichier maître ne contient pas encore de dépenses enregistrées.
        </p>
      ) : (
        <div className="mt-3 max-h-[440px] overflow-auto rounded-lg border border-ink-100">
          <table className="w-full min-w-[520px] text-left text-[11px]">
            <thead className="sticky top-0 bg-ink-50 text-ink-500">
              <tr>
                {["Feuille", "Date", "Fournisseur", "Catégorie", "Montant EUR"].map((h) => (
                  <th key={h} className="px-2 py-1.5 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {preview.rows.map((r, i) => (
                <tr key={i}>
                  <td className="px-2 py-1.5 text-ink-500">{r.sheetName}</td>
                  <td className="px-2 py-1.5">{r.date || "–"}</td>
                  <td className="px-2 py-1.5 text-ink-700">{r.vendor || "–"}</td>
                  <td className="px-2 py-1.5 text-ink-600">{categoryLabel(r.category)}</td>
                  <td className="px-2 py-1.5 font-medium text-ink-900">{eur(r.amountEUR)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DoneCard({
  name,
  total,
  sheetSynced,
  onReset,
}: {
  name: string | null;
  total: number;
  sheetSynced: boolean | null;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Icon name="clipboard-check" className="h-6 w-6" />
      </div>
      <div>
        <div className="text-sm font-semibold text-emerald-900">
          Fichier maître mis à jour et enregistré
        </div>
        <p className="mt-1 text-xs text-emerald-700">
          {name} · total cumulé {eur(total)}. Le fichier est enregistré dans la base et proposé par défaut au prochain lot.
        </p>
        <p className="mt-2 text-xs font-medium">
          {sheetSynced ? (
            <span className="text-emerald-700">✓ Google Sheet synchronisé</span>
          ) : (
            <span className="text-amber-700">
              Google Sheet non synchronisé (le connecteur n&apos;est pas encore configuré)
            </span>
          )}
        </p>
        <p className="mt-2 text-[11px] text-emerald-700">
          Téléchargez le fichier à tout moment avec le bouton « Télécharger le Google Sheet » en haut de page.
        </p>
      </div>
      <button onClick={onReset} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
        Traiter un nouveau lot
      </button>
    </div>
  );
}
