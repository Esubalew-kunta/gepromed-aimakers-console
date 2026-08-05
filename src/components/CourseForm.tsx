"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SponsorPicker } from "./SponsorPicker";
import {
  saveCourse,
  deleteCourse,
  type CourseFormState,
} from "@/app/(app)/courses/actions";
import {
  type Course,
  type Bi,
  type Supervisor,
  type ProgramDay,
  type Sponsor,
  SPECIALTIES,
  SPECIALTY_LABEL,
  LEVELS,
  AUDIENCES,
  COURSE_STATUS,
  PROGRAM_TYPES,
  PROGRAM_TYPE_LABEL,
} from "@/lib/courses-shared";

export function CourseForm({ course }: { course?: Course }) {
  const [state, action, pending] = useActionState<CourseFormState, FormData>(
    saveCourse,
    {},
  );
  const [deleting, startDelete] = useTransition();
  const router = useRouter();
  const editing = Boolean(course);

  const [objectives, setObjectives] = useState<Bi[]>(course?.objectives ?? []);
  const [sups, setSups] = useState<Supervisor[]>(course?.supervisors ?? []);
  const [program, setProgram] = useState<ProgramDay[]>(course?.program ?? []);
  const [preview, setPreview] = useState<string | null>(course?.image_url ?? null);
  const [audienceTags, setAudienceTags] = useState<string[]>(
    course?.target_audience ?? [],
  );
  const [isSponsored, setIsSponsored] = useState(course?.is_sponsored ?? false);
  const [sponsors, setSponsors] = useState<Sponsor[]>(course?.sponsors ?? []);
  // Past-session gallery: `keptPhotos` are existing URLs the admin hasn't
  // removed (submitted as photos_existing); `newPhotos` are freshly picked
  // files, previewed locally and uploaded on submit via the `gallery_photos`
  // file input.
  const [keptPhotos, setKeptPhotos] = useState<string[]>(course?.photos ?? []);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);

  return (
    <form action={action} className="space-y-5">
      {course ? <input type="hidden" name="__slug" value={course.slug} /> : null}
      <input type="hidden" name="objectives" value={JSON.stringify(objectives)} />
      <input type="hidden" name="supervisors" value={JSON.stringify(sups)} />
      <input type="hidden" name="program" value={JSON.stringify(program)} />
      <input type="hidden" name="target_audience" value={JSON.stringify(audienceTags)} />
      <input type="hidden" name="image_url_existing" value={course?.image_url ?? ""} />
      <input type="hidden" name="sponsors" value={JSON.stringify(isSponsored ? sponsors : [])} />
      <input type="hidden" name="photos_existing" value={JSON.stringify(keptPhotos)} />

      {/* Basics */}
      <section className="card space-y-4 p-6">
        <h2 className="text-sm font-semibold text-ink-900">Basics</h2>
        <BiField label="Title" name="title" fr={course?.title.fr} en={course?.title.en} required />
        <BiField label="One-line summary" name="summary" fr={course?.summary.fr} en={course?.summary.en} textarea />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Specialty">
            <select name="specialty" defaultValue={course?.specialty} className="input">
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {SPECIALTY_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Level">
            <select name="level" defaultValue={course?.level} className="input">
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Audience">
            <select name="audience" defaultValue={course?.audience} className="input">
              {AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City">
            <input name="city" defaultValue={course?.city} className="input" />
          </Field>
          <Field label="Qualiopi certified">
            <label className="flex items-center gap-2 pt-2 text-sm text-ink-600">
              <input
                type="checkbox"
                name="qualiopi"
                defaultChecked={course?.qualiopi ?? true}
                className="h-4 w-4"
              />
              Certified
            </label>
          </Field>
        </div>
        <BiField label="Venue" name="venue" fr={course?.venue.fr} en={course?.venue.en} />
        <Field
          label="Cover image"
          hint="Shown on the course card. JPG or PNG. Optional, a specialty photo is used if left empty."
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Course cover preview"
              className="mb-2 h-28 w-full max-w-xs rounded-lg border border-ink-100 object-cover"
            />
          ) : null}
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : course?.image_url ?? null);
            }}
            className="block text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
          />
        </Field>
      </section>

      {/* Schedule & pricing */}
      <section className="card space-y-4 p-6">
        <h2 className="text-sm font-semibold text-ink-900">Schedule &amp; pricing</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Start date">
            <input type="date" name="start_date" defaultValue={course?.start_date} className="input" />
          </Field>
          <Field label="End date">
            <input type="date" name="end_date" defaultValue={course?.end_date} className="input" />
          </Field>
          <Field label="Duration (days)">
            <input type="number" name="duration_days" defaultValue={course?.duration_days ?? 1} className="input" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Price (€)">
            <input type="number" name="price_eur" defaultValue={course?.price_eur} className="input" />
          </Field>
          <Field label="Deposit (€)">
            <input type="number" name="deposit_eur" defaultValue={course?.deposit_eur} className="input" />
          </Field>
          <Field label="Capacity">
            <input type="number" name="capacity" defaultValue={course?.capacity} className="input" />
          </Field>
          <Field label="Status">
            <select name="status" defaultValue={course?.status ?? "open"} className="input">
              {COURSE_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {editing ? (
          <p className="text-xs text-ink-400">
            Enrolled seats ({course?.enrolled ?? 0}/{course?.capacity ?? 0}) update
            automatically as leads are confirmed.
          </p>
        ) : null}
      </section>

      {/* Program PDF workbook */}
      <section className="card space-y-3 p-6">
        <div>
          <h2 className="text-sm font-semibold text-ink-900">Program PDF (.xlsx)</h2>
          <p className="text-xs text-ink-400">
            One workbook per training (Fiche + Planning sheets). Once uploaded, the
            public site&apos;s &quot;Download program&quot; button goes live for this
            training — see{" "}
            <code className="text-ink-500">skills/gepromed-qualiopi-program-generator</code>{" "}
            for the expected format.
          </p>
        </div>
        {course?.program_workbook_path ? (
          <p className="text-xs text-emerald-700">
            ✓ Workbook uploaded ({course.program_workbook_path}). Upload a new file to replace it.
          </p>
        ) : (
          <p className="text-xs text-amber-700">
            No workbook yet — the public PDF button shows &quot;coming soon&quot; until one is uploaded.
          </p>
        )}
        <input type="file" name="program_workbook" accept=".xlsx" className="input" />
      </section>

      {/* Funding & sponsorship — training-level, never per-registrant */}
      <section className="card space-y-4 p-6">
        <div>
          <h2 className="text-sm font-semibold text-ink-900">Funding &amp; sponsorship</h2>
          <p className="text-xs text-ink-400">
            Set once here, for the whole training — never asked of the registrant.
            Self-funded shows the price on the public catalog card; sponsored hides
            the price and shows the sponsor logo instead. HelpMeSee trainings always
            show a price worded &quot;From €X&quot;, regardless of this setting.
          </p>
        </div>
        <Field label="Programme type">
          <select name="program_type" defaultValue={course?.program_type ?? "bootcamp"} className="input">
            {PROGRAM_TYPES.map((p) => (
              <option key={p} value={p}>
                {PROGRAM_TYPE_LABEL[p]}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input
            type="checkbox"
            name="is_sponsored"
            checked={isSponsored}
            onChange={(e) => setIsSponsored(e.target.checked)}
            className="h-4 w-4"
          />
          Sponsored by a third party (lab/company) — hides the price publicly
        </label>
        {isSponsored ? <SponsorPicker value={sponsors} onChange={setSponsors} /> : null}
      </section>

      {/* Qualiopi, public training detail fields */}
      <section className="card space-y-4 p-6">
        <div>
          <h2 className="text-sm font-semibold text-ink-900">Qualiopi</h2>
          <p className="text-xs text-ink-400">
            Public visé, prérequis et méthodes, shown on the public training
            detail page.
          </p>
        </div>
        <Field
          label="Public visé (séparé par des virgules)"
          hint="Ex : Internes, IBODE, Infirmiers, Chirurgiens seniors, Résidents"
        >
          <input
            value={audienceTags.join(", ")}
            onChange={(e) =>
              setAudienceTags(
                e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              )
            }
            placeholder="Internes, IBODE, Infirmiers"
            className="input"
          />
        </Field>
        <BiField
          label="Prérequis"
          name="prerequisites"
          fr={course?.prerequisites?.fr}
          en={course?.prerequisites?.en}
          textarea
        />
        <BiField
          label="Ressources pédagogiques"
          name="pedagogical_resources"
          fr={course?.pedagogical_resources?.fr}
          en={course?.pedagogical_resources?.en}
          textarea
        />
        <BiField
          label="Méthodes d'enseignement"
          name="teaching_methods"
          fr={course?.teaching_methods?.fr}
          en={course?.teaching_methods?.en}
          textarea
        />
        <BiField
          label="Méthodes d'évaluation"
          name="evaluation_methods"
          fr={course?.evaluation_methods?.fr}
          en={course?.evaluation_methods?.en}
          textarea
        />
        <BiField
          label="Organisation / encadrement"
          name="supervision_organization"
          fr={course?.supervision_organization?.fr}
          en={course?.supervision_organization?.en}
          textarea
        />
        <BiField
          label="Accessibilité handicap"
          name="accessibility_info"
          fr={course?.accessibility_info?.fr}
          en={course?.accessibility_info?.en}
          textarea
        />
        <Field
          label="Référent handicap (nom)"
          hint="Named disability-referent contact, shown on the PDF and detail page."
        >
          <input
            name="accessibility_referent"
            defaultValue={course?.accessibility_referent}
            className="input"
          />
        </Field>
        <BiField
          label="Certificat / attestation délivrée"
          name="certificate_delivered"
          fr={course?.certificate_delivered?.fr}
          en={course?.certificate_delivered?.en}
          textarea
        />
        <BiField
          label="Modalités et délais d'inscription"
          name="registration_info"
          fr={course?.registration_info?.fr}
          en={course?.registration_info?.en}
          textarea
        />
        <BiField
          label="Tarif (texte libre)"
          name="price_note"
          fr={course?.price_note?.fr}
          en={course?.price_note?.en}
          textarea
        />
      </section>

      {/* Objectives repeater */}
      <section className="card space-y-3 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">Learning objectives</h2>
          <button
            type="button"
            onClick={() => setObjectives((o) => [...o, { fr: "", en: "" }])}
            className="btn-ghost !py-1.5 !text-xs"
          >
            + Add objective
          </button>
        </div>
        {objectives.length === 0 ? (
          <p className="text-xs text-ink-400">No objectives yet.</p>
        ) : null}
        {objectives.map((o, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={o.fr}
              onChange={(e) =>
                setObjectives((arr) => arr.map((x, j) => (j === i ? { ...x, fr: e.target.value } : x)))
              }
              placeholder="Objectif (FR)"
              className="input"
            />
            <input
              value={o.en}
              onChange={(e) =>
                setObjectives((arr) => arr.map((x, j) => (j === i ? { ...x, en: e.target.value } : x)))
              }
              placeholder="Objective (EN)"
              className="input"
            />
            <button
              type="button"
              onClick={() => setObjectives((arr) => arr.filter((_, j) => j !== i))}
              className="rounded-lg px-2 text-sm text-red-500 hover:bg-red-50"
            >
              ✕
            </button>
          </div>
        ))}
      </section>

      {/* Supervisors repeater */}
      <section className="card space-y-3 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">Supervisors</h2>
          <button
            type="button"
            onClick={() => setSups((s) => [...s, { name: "", role: { fr: "", en: "" } }])}
            className="btn-ghost !py-1.5 !text-xs"
          >
            + Add supervisor
          </button>
        </div>
        {sups.length === 0 ? <p className="text-xs text-ink-400">No supervisors yet.</p> : null}
        {sups.map((s, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <input
              value={s.name}
              onChange={(e) =>
                setSups((arr) => arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
              }
              placeholder="Name"
              className="input"
            />
            <input
              value={s.role.fr}
              onChange={(e) =>
                setSups((arr) => arr.map((x, j) => (j === i ? { ...x, role: { ...x.role, fr: e.target.value } } : x)))
              }
              placeholder="Rôle (FR)"
              className="input"
            />
            <input
              value={s.role.en}
              onChange={(e) =>
                setSups((arr) => arr.map((x, j) => (j === i ? { ...x, role: { ...x.role, en: e.target.value } } : x)))
              }
              placeholder="Role (EN)"
              className="input"
            />
            <button
              type="button"
              onClick={() => setSups((arr) => arr.filter((_, j) => j !== i))}
              className="rounded-lg px-2 text-sm text-red-500 hover:bg-red-50"
            >
              ✕
            </button>
          </div>
        ))}
      </section>

      {/* Day-by-day program (structured) */}
      <section className="card space-y-3 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink-900">Day-by-day program</h2>
            <p className="text-xs text-ink-400">
              One block per day (title in FR + EN), then the sessions inside that day.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setProgram((p) => [...p, { day: { fr: "", en: "" }, items: [] }])}
            className="btn-ghost shrink-0 !py-1.5 !text-xs"
          >
            + Add day
          </button>
        </div>
        {program.length === 0 ? (
          <p className="text-xs text-ink-400">No days yet. Add a day, then add its sessions.</p>
        ) : null}
        {program.map((d, di) => (
          <div key={di} className="space-y-2 rounded-xl border border-ink-100 p-4">
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                value={d.day.fr}
                onChange={(e) =>
                  setProgram((p) => p.map((x, i) => (i === di ? { ...x, day: { ...x.day, fr: e.target.value } } : x)))
                }
                placeholder="Jour 1, Fondamentaux (FR)"
                className="input font-medium"
              />
              <input
                value={d.day.en}
                onChange={(e) =>
                  setProgram((p) => p.map((x, i) => (i === di ? { ...x, day: { ...x.day, en: e.target.value } } : x)))
                }
                placeholder="Day 1, Fundamentals (EN)"
                className="input font-medium"
              />
              <button
                type="button"
                onClick={() => setProgram((p) => p.filter((_, i) => i !== di))}
                className="rounded-lg px-2 text-sm text-red-500 hover:bg-red-50"
                title="Remove day"
              >
                ✕
              </button>
            </div>
            {d.items.map((it, ii) => (
              <div key={ii} className="grid gap-2 pl-4 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  value={it.fr}
                  onChange={(e) =>
                    setProgram((p) =>
                      p.map((x, i) =>
                        i === di ? { ...x, items: x.items.map((y, j) => (j === ii ? { ...y, fr: e.target.value } : y)) } : x,
                      ),
                    )
                  }
                  placeholder="Activité (FR)"
                  className="input"
                />
                <input
                  value={it.en}
                  onChange={(e) =>
                    setProgram((p) =>
                      p.map((x, i) =>
                        i === di ? { ...x, items: x.items.map((y, j) => (j === ii ? { ...y, en: e.target.value } : y)) } : x,
                      ),
                    )
                  }
                  placeholder="Item (EN)"
                  className="input"
                />
                <button
                  type="button"
                  onClick={() =>
                    setProgram((p) => p.map((x, i) => (i === di ? { ...x, items: x.items.filter((_, j) => j !== ii) } : x)))
                  }
                  className="rounded-lg px-2 text-sm text-red-500 hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setProgram((p) => p.map((x, i) => (i === di ? { ...x, items: [...x.items, { fr: "", en: "" }] } : x)))
              }
              className="btn-ghost ml-4 !py-1 !text-xs"
            >
              + Add session
            </button>
          </div>
        ))}
      </section>

      {/* Session proof */}
      <section className="card space-y-4 p-6">
        <h2 className="text-sm font-semibold text-ink-900">
          Session proof <span className="font-normal text-ink-400">(past sessions only)</span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Satisfaction %">
            <input type="number" name="satisfaction" defaultValue={course?.satisfaction ?? ""} className="input" />
          </Field>
          <Field label="Pass rate %">
            <input type="number" name="pass_rate" defaultValue={course?.pass_rate ?? ""} className="input" />
          </Field>
        </div>
        <PhotoGalleryField
          keptPhotos={keptPhotos}
          onRemoveKept={(url) => setKeptPhotos((p) => p.filter((u) => u !== url))}
          newPhotos={newPhotos}
          onAddNew={(files) => setNewPhotos((p) => [...p, ...files])}
          onRemoveNew={(i) => setNewPhotos((p) => p.filter((_, j) => j !== i))}
        />
      </section>

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving…" : editing ? "Save changes" : "Create course"}
        </button>
        {editing ? (
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (confirm(`Delete "${course!.title.fr}"? This cannot be undone.`)) {
                startDelete(() => deleteCourse(course!.slug).then(() => router.push("/courses")));
              }
            }}
            className="rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            {deleting ? "Deleting…" : "Delete course"}
          </button>
        ) : null}
      </div>
    </form>
  );
}

// Mirrors the server-side cap in courses/actions.ts — keep both in sync.
const MAX_GALLERY_PHOTOS = 12;

/**
 * Past-session photo gallery: shows already-uploaded photos (removable) plus
 * thumbnails of newly picked, not-yet-uploaded files (also removable before
 * submit), and a picker to add more. Files are added across possibly several
 * separate picks, so a plain `<input type="file" multiple>` bound straight to
 * the form won't work — its `.files` only ever holds the LAST selection. A
 * hidden input's `.files` is instead synced from the accumulated `newPhotos`
 * state via a DataTransfer, so the actual form submission carries everything
 * picked so far, added in one go or several.
 */
function PhotoGalleryField({
  keptPhotos,
  onRemoveKept,
  newPhotos,
  onAddNew,
  onRemoveNew,
}: {
  keptPhotos: string[];
  onRemoveKept: (url: string) => void;
  newPhotos: File[];
  onAddNew: (files: File[]) => void;
  onRemoveNew: (index: number) => void;
}) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const total = keptPhotos.length + newPhotos.length;
  const remaining = MAX_GALLERY_PHOTOS - total;

  useEffect(() => {
    const dt = new DataTransfer();
    for (const f of newPhotos) dt.items.add(f);
    if (hiddenInputRef.current) hiddenInputRef.current.files = dt.files;
  }, [newPhotos]);

  return (
    <div>
      <label className="label">Photo gallery</label>
      <p className="mb-2 text-xs text-ink-400">
        Shown on the public site&apos;s training detail page once the session has
        happened. JPEG, PNG or WEBP. {total}/{MAX_GALLERY_PHOTOS} photos.
      </p>

      {keptPhotos.length > 0 || newPhotos.length > 0 ? (
        <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {keptPhotos.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-ink-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemoveKept(url)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove photo"
                title="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}
          {newPhotos.map((f, i) => (
            <div key={`${f.name}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border border-brand-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
              <span className="absolute left-1 top-1 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                new
              </span>
              <button
                type="button"
                onClick={() => onRemoveNew(i)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove photo"
                title="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {remaining > 0 ? (
        <input
          ref={pickerRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []).slice(0, remaining);
            if (files.length) onAddNew(files);
            if (pickerRef.current) pickerRef.current.value = "";
          }}
          className="block text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
        />
      ) : (
        <p className="text-xs text-ink-400">
          Limit reached — remove a photo to add another.
        </p>
      )}
      {/* Actually submitted with the form; kept in sync with newPhotos above. */}
      <input ref={hiddenInputRef} type="file" name="gallery_photos" multiple className="hidden" />
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-ink-400">{hint}</p> : null}
    </div>
  );
}

function BiField({
  label,
  name,
  fr,
  en,
  textarea,
  required,
}: {
  label: string;
  name: string;
  fr?: string;
  en?: string;
  textarea?: boolean;
  required?: boolean;
}) {
  const cls = "input" + (textarea ? " resize-y" : "");
  return (
    <div>
      <label className="label">
        {label} {required ? "*" : ""}
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        {textarea ? (
          <>
            <textarea name={`${name}_fr`} defaultValue={fr} rows={2} placeholder="Français" required={required} className={cls} />
            <textarea name={`${name}_en`} defaultValue={en} rows={2} placeholder="English" className={cls} />
          </>
        ) : (
          <>
            <input name={`${name}_fr`} defaultValue={fr} placeholder="Français" required={required} className={cls} />
            <input name={`${name}_en`} defaultValue={en} placeholder="English" className={cls} />
          </>
        )}
      </div>
    </div>
  );
}
