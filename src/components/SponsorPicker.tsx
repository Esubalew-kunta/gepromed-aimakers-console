"use client";

import { useEffect, useRef, useState } from "react";
import type { Sponsor } from "@/lib/courses-shared";

/**
 * Reusable sponsor picker (client pt. 4 & 5). Loads the sponsor library from
 * /api/sponsors, lets the user select one OR several existing sponsors, and
 * offers an "Add new sponsor" popup (logo required + name required + website
 * optional) that uploads the logo, saves the sponsor to the library, and
 * selects it. The selected sponsors (value) are what the training stores.
 */
export function SponsorPicker({
  value,
  onChange,
}: {
  value: Sponsor[];
  onChange: (next: Sponsor[]) => void;
}) {
  const [library, setLibrary] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("/api/sponsors")
      .then((r) => r.json())
      .then((d) => setLibrary(Array.isArray(d.sponsors) ? d.sponsors : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isSelected = (sp: Sponsor) => value.some((v) => v.id && sp.id && v.id === sp.id);
  const toggle = (sp: Sponsor) =>
    isSelected(sp) ? onChange(value.filter((v) => v.id !== sp.id)) : onChange([...value, sp]);
  const removeAt = (i: number) => onChange(value.filter((_, j) => j !== i));

  function onCreated(sp: Sponsor) {
    setLibrary((lib) => [...lib, sp].sort((a, b) => a.name.localeCompare(b.name)));
    onChange([...value, sp]); // auto-select the newly created sponsor
    setShowModal(false);
  }

  return (
    <div className="space-y-3 rounded-xl border border-ink-100 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-ink-700">Sponsor(s)</h3>
        <button type="button" onClick={() => setShowModal(true)} className="btn-ghost !py-1 !text-xs">
          + Add new sponsor
        </button>
      </div>

      {/* Selected sponsors */}
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((s, i) => (
            <span
              key={s.id ?? `${s.name}-${i}`}
              className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 py-1 pl-1.5 pr-2 text-xs text-brand-800"
            >
              {s.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logoUrl} alt="" className="h-5 w-5 rounded-full object-contain bg-white" />
              ) : null}
              <span className="font-medium">{s.name || "—"}</span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="text-brand-400 hover:text-red-500"
                aria-label="Retirer"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-ink-400">Aucun sponsor sélectionné — choisissez-en dans la liste ou ajoutez-en un.</p>
      )}

      {/* Library to pick from */}
      <div>
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Bibliothèque</div>
        {loading ? (
          <p className="text-xs text-ink-400">Chargement…</p>
        ) : library.length === 0 ? (
          <p className="text-xs text-ink-400">Aucun sponsor enregistré. Cliquez « + Add new sponsor ».</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {library.map((sp) => {
              const sel = isSelected(sp);
              return (
                <button
                  type="button"
                  key={sp.id}
                  onClick={() => toggle(sp)}
                  className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition ${
                    sel ? "border-brand-400 bg-brand-50 ring-1 ring-brand-300" : "border-ink-200 bg-white hover:bg-ink-50"
                  }`}
                  title={sp.website || sp.name}
                >
                  {sp.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sp.logoUrl} alt="" className="h-8 w-8 shrink-0 rounded object-contain bg-white" />
                  ) : (
                    <span className="h-8 w-8 shrink-0 rounded bg-ink-100" />
                  )}
                  <span className="min-w-0 flex-1 truncate font-medium text-ink-800">{sp.name}</span>
                  <span className={`text-sm ${sel ? "text-brand-600" : "text-ink-300"}`}>{sel ? "✓" : "+"}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showModal && <AddSponsorModal onClose={() => setShowModal(false)} onCreated={onCreated} />}
    </div>
  );
}

function AddSponsorModal({ onClose, onCreated }: { onClose: () => void; onCreated: (s: Sponsor) => void }) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function pickLogo(f: File | null) {
    setLogo(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit() {
    setError(null);
    if (!name.trim()) return setError("Le nom du sponsor est requis.");
    if (!logo) return setError("Le logo est requis.");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("website", website.trim());
      fd.append("logo", logo);
      const res = await fetch("/api/sponsors", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.sponsor) throw new Error(data.error || "Échec de l'ajout du sponsor.");
      onCreated(data.sponsor as Sponsor);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-ink-200 bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-sm font-semibold text-ink-900">Nouveau sponsor</div>
        <p className="mt-1 text-xs text-ink-500">Ajouté à la bibliothèque et réutilisable pour toute formation.</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">Logo <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
              >
                {logo ? "Changer le logo" : "Choisir un fichier"}
              </button>
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-10 w-10 rounded border border-ink-100 object-contain bg-white" />
              ) : (
                <span className="text-xs text-ink-400">PNG, JPG, SVG, WebP · max 4 Mo</span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                className="hidden"
                onChange={(e) => pickLogo(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">Nom du sponsor <span className="text-red-500">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : HelpMeSee" className="input" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">Site web (optionnel)</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className="input" />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50 disabled:opacity-50">
            Annuler
          </button>
          <button type="button" onClick={submit} disabled={submitting} className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            {submitting ? "Ajout…" : "Ajouter le sponsor"}
          </button>
        </div>
      </div>
    </div>
  );
}
