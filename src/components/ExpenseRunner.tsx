"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { ExpenseUploader } from "./ExpenseUploader";
import {
  CATEGORY_KEYS,
  CATEGORY_COLUMN,
  type AnalyzeResult,
  type ProcessedExpense,
  type CategoryKey,
} from "@/lib/expenses/types";

type Phase = "setup" | "analyzing" | "review" | "committing" | "done";

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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Échec de l'écriture.");
      }
      const blob = await res.blob();
      const name = result.masterFileName || "Matrice LM_0226_rembt Frais.xlsx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setCommittedName(name);
      setPhase("done");
    } catch (e) {
      setError((e as Error).message);
      setPhase("review");
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
      {!extractionReady && (
        <Banner tone="amber">
          L&apos;extraction IA (ANTHROPIC_API_KEY) n&apos;est pas configurée sur ce serveur, l&apos;analyse ne
          fonctionnera pas tant que la clé n&apos;est pas ajoutée.
        </Banner>
      )}
      {error && <Banner tone="red">{error}</Banner>}

      {(phase === "setup" || phase === "analyzing") && (
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
      )}

      {phase === "review" && result && (
        <ReviewTable result={result} onPatch={patch} onCommit={commit} onBack={reset} />
      )}
      {phase === "committing" && <Progress label="Écriture dans le fichier Excel de Nathalie…" />}
      {phase === "done" && <DoneCard name={committedName} total={result?.grandTotalEUR ?? 0} onReset={reset} />}
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
          <Icon name="clipboard-check" className="h-4 w-4" />
          {p.analyzing ? "Analyse en cours…" : "Analyser les justificatifs"}
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
        <table className="w-full min-w-[1050px] text-left text-xs">
          <thead className="bg-ink-50 text-ink-500">
            <tr>
              {["Justificatif", "Date", "Fournisseur", "Catégorie", "Montant d'origine", "Montant EUR", "TVA", "Feuille", "Voyageur", "Objet", "État"].map((h) => (
                <th key={h} className="px-2.5 py-2 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {active.map((e) => (
              <tr key={e.id} className={e.needsReview ? "bg-amber-50/50" : ""}>
                <td className="px-2.5 py-2 text-ink-500">{e.sourceFile}</td>
                <td className="px-2.5 py-2">
                  <input
                    value={e.issueDateLabel || ""}
                    onChange={(ev) => onPatch(e.id, { issueDateLabel: ev.target.value })}
                    className="w-24 rounded border border-ink-200 px-1.5 py-1"
                  />
                </td>
                <td className="px-2.5 py-2 text-ink-700">{e.vendor || "–"}</td>
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
                <td className="px-2.5 py-2 text-ink-600">
                  {e.originalAmount != null ? `${e.originalAmount} ${e.originalCurrency || ""}` : "–"}
                  {e.fx && (
                    <div className="text-[10px] text-ink-400" title={`Taux ${e.fx.rate} ${e.fx.originalCurrency}/EUR, ${e.fx.source} ${e.fx.rateDate}`}>
                      @ {e.fx.rate} ({e.fx.source})
                    </div>
                  )}
                </td>
                <td className="px-2.5 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={e.amountEUR ?? ""}
                    onChange={(ev) => onPatch(e.id, { amountEUR: ev.target.value === "" ? null : Number(ev.target.value) })}
                    className="w-24 rounded border border-ink-200 px-1.5 py-1"
                  />
                </td>
                <td className="px-2.5 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={e.vatRecoverable ?? ""}
                    onChange={(ev) => onPatch(e.id, { vatRecoverable: ev.target.value === "" ? null : Number(ev.target.value) })}
                    className="w-16 rounded border border-ink-200 px-1.5 py-1"
                  />
                </td>
                <td className="px-2.5 py-2">
                  <input
                    value={e.sheetName}
                    onChange={(ev) => onPatch(e.id, { sheetName: ev.target.value })}
                    className="w-28 rounded border border-ink-200 px-1.5 py-1"
                  />
                </td>
                <td className="px-2.5 py-2">
                  <input
                    value={e.traveler}
                    onChange={(ev) => onPatch(e.id, { traveler: ev.target.value })}
                    className="w-32 rounded border border-ink-200 px-1.5 py-1"
                  />
                </td>
                <td className="px-2.5 py-2">
                  <input
                    value={e.purpose || ""}
                    onChange={(ev) => onPatch(e.id, { purpose: ev.target.value })}
                    className="w-36 rounded border border-ink-200 px-1.5 py-1"
                  />
                </td>
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
                <td className="px-2.5 py-2">{e.issueDateLabel || "–"}</td>
                <td className="px-2.5 py-2">{e.vendor || "–"}</td>
                <td className="px-2.5 py-2" colSpan={7}>
                  {e.duplicateOfId ? "Doublon, compté une seule fois" : "Déjà traité lors d'un run précédent"}
                </td>
                <td className="px-2.5 py-2">
                  <span className="inline-block rounded bg-ink-200 px-1.5 py-0.5 text-[10px] font-semibold text-ink-600">ignoré</span>
                </td>
              </tr>
            ))}
            {active.length === 0 && excluded.length === 0 && (
              <tr>
                <td colSpan={11} className="px-2.5 py-8 text-center text-ink-400">
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

function DoneCard({ name, total, onReset }: { name: string | null; total: number; onReset: () => void }) {
  return (
    <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Icon name="clipboard-check" className="h-6 w-6" />
      </div>
      <div>
        <div className="text-sm font-semibold text-emerald-900">Fichier généré et téléchargé</div>
        <p className="mt-1 text-xs text-emerald-700">
          {name} · total cumulé {eur(total)}. Ouvrez-le, vérifiez, corrigez si besoin, les lignes validées sont verrouillées au prochain run.
        </p>
      </div>
      <button onClick={onReset} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
        Traiter un nouveau lot
      </button>
    </div>
  );
}
