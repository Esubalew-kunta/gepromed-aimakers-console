import { z } from "zod";

/**
 * Shared types + Zod schemas for the Notes-de-frais (expense notes) feature.
 *
 * Pipeline: upload receipts -> Claude vision extraction (ReceiptExtraction)
 * -> normalize + FX (ProcessedExpense) -> dedup/route -> human review
 * -> write into Nathalie's master Matrice workbook.
 *
 * Golden rule (PRD H1): never invent a missing field. Missing/uncertain =>
 * null + flagged for Nathalie. Nothing here fabricates data.
 */

// ---------------------------------------------------------------------------
// Category <-> Matrice column mapping (PRD §7.4 + Excel appendix).
// We write by COLUMN LETTER (not header text) to avoid the template's curly
// apostrophe / embedded newline in the header cells.
// ---------------------------------------------------------------------------

export const CATEGORY_KEYS = [
  "flight", // Billet d'avion       -> F
  "hotel", // Hébergement           -> G
  "train", // Train/Métro (train, metro, tram, bus) -> H
  "taxi", // Taxi / VTC             -> I
  "toll", // Autoroute (péage)      -> J
  "parking", // Parking             -> K
  "meals", // Repas et pourboires   -> L
  "conference", // Conférences et séminaires -> M
  "mileage", // Kilomètres          -> N (O = reimbursement formula)
  "misc", // Divers                 -> P
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

/**
 * Category key -> { amount column letter, label matching the Matrice's own
 * row-13 header text byte-for-byte (curly apostrophe in "avion", embedded
 * newline in "Train / Métro") so anything shown in the UI reads exactly like
 * the sheet Nathalie sees.
 */
export const CATEGORY_COLUMN: Record<CategoryKey, { col: string; label: string }> = {
  flight: { col: "F", label: "Billet d’avion" },
  hotel: { col: "G", label: "Hébergement" },
  train: { col: "H", label: "Train \n Métro" },
  taxi: { col: "I", label: "Taxi" },
  toll: { col: "J", label: "Autoroute" },
  parking: { col: "K", label: "Parking" },
  meals: { col: "L", label: "Repas et pourboires" },
  conference: { col: "M", label: "Conférences et séminaires" },
  // Distance isn't captured by extraction (no km field) — write the flat euro
  // amount straight into the reimbursement column, not the distance column,
  // so it isn't double-counted by the Kilométrage*N formula in excel.ts.
  mileage: { col: "O", label: "Remboursement du kilométrage" },
  misc: { col: "P", label: "Divers" },
};

/** Full Matrice row-13 header set, in sheet order (B..S) — for previews/exports. */
export const MATRICE_HEADERS = [
  "Date",
  "Etude",
  "Objet",
  "Lieu du déplacement",
  "Billet d’avion",
  "Hébergement",
  "Train \n Métro",
  "Taxi",
  "Autoroute",
  "Parking",
  "Repas et pourboires",
  "Conférences et séminaires",
  "Kilomètres",
  "Remboursement du kilométrage",
  "Divers",
  "TVA récupérable",
  "Devise de dépense",
  "Total",
] as const;

// Fixed Matrice geometry (PRD Excel appendix, verified against the real file).
export const MATRICE = {
  templateSheet: "Matrice",
  summarySheet: "Synthèse",
  ledgerSheet: "_Ledger",
  titleCell: "G2",
  nameCell: "C5",
  serviceCell: "C7",
  periodCell: "C9",
  reimbTotalCell: "Q7",
  headerRow: 13,
  firstDataRow: 14,
  // amount columns summed by the Total formula (F..P, excludes Q TVA)
  firstCategoryCol: "F",
  lastCategoryCol: "P",
  vatCol: "Q",
  currencyCol: "R",
  totalCol: "S",
  mileageReimbCol: "O",
  mileageCol: "N",
  definedNameKm: "Kilométrage",
} as const;

export const DOC_NATURES = ["invoice", "receipt", "booking", "other"] as const;
export type DocNature = (typeof DOC_NATURES)[number];

// ---------------------------------------------------------------------------
// Zod schema: what Claude must return per receipt (validated at the boundary).
// Every value nullable so the model can honestly say "not present" (never guess).
// ---------------------------------------------------------------------------

const ConfidenceField = z.object({
  value: z.union([z.string(), z.number()]).nullable(),
  confidence: z.number().min(0).max(1),
  /** true = read directly from the document; false = inferred/deduced. */
  extracted: z.boolean(),
});
export type ConfidenceField = z.infer<typeof ConfidenceField>;

/**
 * Tolerant per-receipt schema. Every field uses `.catch(...)` so a missing or
 * malformed value from a less-reliable model (e.g. gpt-4o-mini omitting the
 * nested `confidence` object or a nullable field, or returning an out-of-enum
 * category) degrades to a safe default INSTEAD of rejecting the whole receipt.
 * The row still surfaces for Nathalie's review (flagged), never silently lost.
 */
const conf = () => z.number().catch(0.5);
export const ReceiptExtractionSchema = z.object({
  /** Issue date of the receipt, ISO yyyy-mm-dd, or null if unreadable. */
  issueDate: z.string().nullable().catch(null),
  /** Issue date exactly as printed (for audit / ambiguity checks). */
  issueDateRaw: z.string().nullable().catch(null),
  /** Total actually PAID, TTC (never HT). null if unclear. */
  amountTTC: z.number().nullable().catch(null),
  /** ISO 4217 code of the amount actually paid (EUR, USD, JPY, DKK, AED...). */
  currency: z.string().nullable().catch(null),
  vendor: z.string().nullable().catch(null),
  /** One of the fixed category keys, or null if it cannot be determined. */
  category: z.enum(CATEGORY_KEYS).nullable().catch(null),
  /** Recoverable VAT ONLY if explicitly itemized; else null (never computed). */
  vatRecoverable: z.number().nullable().catch(null),
  /**
   * Distance driven in km, ONLY when a real distance figure is printed on the
   * document (mileage claim showing km, not a euro amount). null otherwise —
   * never estimated. Used to compute the reimbursement via the workbook's own
   * `Kilométrage` rate cell instead of requiring a pre-computed euro amount.
   */
  distanceKm: z.number().nullable().catch(null),
  docNature: z.enum(DOC_NATURES).nullable().catch(null),
  paymentProofPresent: z.boolean().catch(false),
  /** Invoice / ticket / booking number — used for dedup. */
  docNumber: z.string().nullable().catch(null),
  location: z.string().nullable().catch(null),
  /** Traveler name(s) if printed on the document. */
  passengers: z.array(z.string()).catch([]),
  /** Purpose/motif if inferable from the doc (else from deposit message). */
  purpose: z.string().nullable().catch(null),
  /** Per-field confidence 0..1 for the key fields. */
  confidence: z
    .object({
      issueDate: conf(),
      amountTTC: conf(),
      currency: conf(),
      vendor: conf(),
      category: conf(),
    })
    .catch({ issueDate: 0.5, amountTTC: 0.5, currency: 0.5, vendor: 0.5, category: 0.5 }),
  /** Model-raised flags (multi-passenger, several amounts, poor scan, etc.). */
  alerts: z.array(z.string()).catch([]),
});
export type ReceiptExtraction = z.infer<typeof ReceiptExtractionSchema>;

/** A file may contain several receipts (PRD J1) -> the model returns a list. */
export const FileExtractionSchema = z.object({
  isReceipt: z.boolean(),
  reasonIfNot: z.string().nullable().default(null),
  receipts: z.array(ReceiptExtractionSchema).default([]),
});
export type FileExtraction = z.infer<typeof FileExtractionSchema>;

// ---------------------------------------------------------------------------
// Deposit context Nathalie provides with a batch (traveler + purpose + trip).
// ---------------------------------------------------------------------------

export interface DepositContext {
  description: string; // free text
  traveler?: string;
  purpose?: string;
  tripHint?: string; // e.g. "Venise", "Japon congrès"
  period?: string; // e.g. "1er trimestre 2026"
}

// ---------------------------------------------------------------------------
// FX result.
// ---------------------------------------------------------------------------

export interface FxResult {
  /** EUR value of amountTTC. */
  amountEUR: number;
  /** original units per 1 EUR (e.g. 7.4688 DKK/EUR). */
  rate: number;
  rateDate: string; // actual quote date used (may be prior business day)
  requestedDate: string; // the invoice issue date requested
  source: string; // "ECB (Frankfurter)" | "CurrencyBeacon"
  originalAmount: number;
  originalCurrency: string;
  /** true when rateDate != requestedDate (weekend/holiday fallback). */
  dateAdjusted: boolean;
}

// ---------------------------------------------------------------------------
// A fully processed expense line, ready for review + Excel write.
// ---------------------------------------------------------------------------

export type TravelerSource = "extracted" | "deduced" | "unresolved";

export interface ProcessedExpense {
  id: string; // stable per-line id (docKey or file hash based)
  sourceFile: string;
  fileHash: string;

  // extracted / normalized
  issueDate: string | null; // ISO
  issueDateLabel: string | null; // dd/mm/yyyy for the sheet
  issueDateRaw: string | null;
  vendor: string | null;
  category: CategoryKey | null;
  docNature: DocNature | null;
  paymentProofPresent: boolean;
  docNumber: string | null;
  location: string | null;
  purpose: string | null;
  passengers: string[];
  /** Study/project code (Matrice "Etude" column) — not extracted, Nathalie fills it in manually during review. */
  etude: string | null;

  // amounts
  originalAmount: number | null;
  originalCurrency: string | null;
  vatRecoverable: number | null;
  amountEUR: number | null;
  fx: FxResult | null;
  /** Real distance in km when the doc shows one (mileage only); else null. */
  distanceKm: number | null;
  /** true when amountEUR for a mileage row was computed (distanceKm × rate) rather than read directly off the document. */
  mileageComputed: boolean;

  // routing
  traveler: string;
  travelerSource: TravelerSource;
  tripLabel: string; // human "Venise ↔ Strasbourg"
  sheetName: string; // Excel sheet "Venise_0326"
  period: string; // C9 value

  // dedup / control
  docKey: string;
  duplicateOfId: string | null; // set when this is a duplicate within the batch (excluded)
  idempotentSkip: boolean; // already present in the workbook _Ledger from a prior run
  mergedFromIds: string[]; // booking + payment merged into this line
  confidence: ReceiptExtraction["confidence"];
  needsReview: boolean;
  reviewReasons: string[];
  alerts: string[];
  /** true once the reviewer edited a value in the UI (so the edited value is committed). */
  edited?: boolean;
  /** true once written & validated (locked); never re-written. */
  locked: boolean;
}

/** Result of the analyze step returned to the review UI. */
export interface AnalyzeResult {
  runId: string;
  masterFileName: string;
  expenses: ProcessedExpense[];
  skipped: { file: string; reason: string }[];
  groups: { sheetName: string; tripLabel: string; traveler: string; period: string; count: number; totalEUR: number }[];
  alerts: string[];
  grandTotalEUR: number;
}
