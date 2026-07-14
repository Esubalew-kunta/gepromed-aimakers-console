/**
 * Generic pipeline engine — shared by every tracked board in the console
 * (trainees, explant analysis, test platform, equipment rental…).
 *
 * Master Plan Decision 1 (LOCKED): we build the board ONCE and each domain
 * declares its own stages + variants, instead of copy-pasting a board per
 * domain. A "pipeline" is one or more ordered VARIANTS (e.g. the two trainee
 * parcours, or the hospital/industrial explant cases); each variant is an
 * ordered list of stages. Domain modules build a `PipelineDef`; the shared
 * helpers below (and, from Phase 5, a shared `PipelineBoard`) operate on it.
 *
 * Pure + client-safe: no server-only imports, no side effects.
 */

/** Local 2-value language union (kept standalone so core stays dependency-free). */
export type Lang = "fr" | "en";

/**
 * A label that is either a plain string (legacy / French-only, e.g. the trainee
 * pipeline) or a `{fr,en}` pair (engineering). `loc()` resolves it for a lang;
 * the label helpers below take an optional `lang` (default "fr") so existing
 * single-string callers keep the exact behaviour they had before.
 */
export type Localized = string | { fr: string; en: string };

export function loc(v: Localized | null | undefined, lang: Lang = "fr"): string {
  if (v == null) return "";
  return typeof v === "string" ? v : v[lang] ?? v.fr;
}

export interface StageDef {
  /** Stable id persisted in the DB `stage` column. */
  id: string;
  /** Label shown on stage badges (string = FR-only, or `{fr,en}`). */
  label: Localized;
  /** Short cap shown under stepper nodes. */
  short: Localized;
  /** Tailwind badge classes. */
  tone: string;
  /** Button label that advances to the NEXT stage (null = terminal stage). */
  advanceLabel: Localized | null;
}

export interface VariantDef {
  /** Stable id persisted in the DB `parcours` / `variant` column. */
  key: string;
  label: Localized;
  tone: string;
  /** Ordered stages for this variant. */
  stages: StageDef[];
}

export interface PipelineDef {
  /** 'trainee' | 'explant' | 'test' | 'equipment' … */
  kind: string;
  /** Module label, e.g. "Trainees management" (string = FR-only, or `{fr,en}`). */
  label: Localized;
  variants: VariantDef[];
  /** Variant used for a row that has none set yet. */
  defaultVariantKey: string;
  /** Exit status available at any stage, e.g. 'not_interested' | 'declined'. */
  exitStatus: string;
}

/* ------------------------------------------------------------------ *
 * Generic helpers (pure). Every board/domain uses these instead of
 * hand-writing per-variant switch logic.
 * ------------------------------------------------------------------ */

/** Resolve a variant by key, falling back to the pipeline's default. */
export function getVariant(def: PipelineDef, key: string): VariantDef {
  return (
    def.variants.find((v) => v.key === key) ??
    def.variants.find((v) => v.key === def.defaultVariantKey) ??
    def.variants[0]
  );
}

export function variantKeys(def: PipelineDef): string[] {
  return def.variants.map((v) => v.key);
}

/** Ordered stage ids for a variant. */
export function stageIdsFor(def: PipelineDef, variantKey: string): string[] {
  return getVariant(def, variantKey).stages.map((s) => s.id);
}

export function findStage(
  def: PipelineDef,
  variantKey: string,
  stageId: string,
): StageDef | undefined {
  return getVariant(def, variantKey).stages.find((s) => s.id === stageId);
}

export function stageLabelOf(
  def: PipelineDef,
  variantKey: string,
  stageId: string,
  lang: Lang = "fr",
): string {
  const s = findStage(def, variantKey, stageId);
  return s ? loc(s.label, lang) : stageId;
}

export function stageShortOf(
  def: PipelineDef,
  variantKey: string,
  stageId: string,
  lang: Lang = "fr",
): string {
  const s = findStage(def, variantKey, stageId);
  return s ? loc(s.short, lang) : stageId;
}

export function stageToneOf(def: PipelineDef, variantKey: string, stageId: string): string {
  return findStage(def, variantKey, stageId)?.tone ?? "bg-ink-100 text-ink-600";
}

export function advanceLabelOf(
  def: PipelineDef,
  variantKey: string,
  stageId: string,
  lang: Lang = "fr",
): string | null {
  const v = findStage(def, variantKey, stageId)?.advanceLabel;
  return v == null ? null : loc(v, lang);
}

/** Resolve a variant's display label for a language. */
export function variantLabelOf(def: PipelineDef, variantKey: string, lang: Lang = "fr"): string {
  return loc(getVariant(def, variantKey).label, lang);
}

/** The next stage id in the variant's order (null if terminal / unknown). */
export function nextStageId(
  def: PipelineDef,
  variantKey: string,
  stageId: string,
): string | null {
  const ids = stageIdsFor(def, variantKey);
  const i = ids.indexOf(stageId);
  return i >= 0 && i < ids.length - 1 ? ids[i + 1] : null;
}
