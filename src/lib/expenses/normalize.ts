import "server-only";
import {
  type ReceiptExtraction,
  type DepositContext,
  type ProcessedExpense,
  type FxResult,
  type TravelerSource,
} from "./types";

/**
 * Turns a raw Claude extraction (+ deposit context + FX) into a ProcessedExpense
 * with a proposed trip/sheet routing and a `needsReview` flag list. Everything
 * proposed here is editable by Nathalie in the review table before commit —
 * we PROPOSE, we never silently guess.
 */

const CONFIDENCE_FLOOR = 0.7;

export function quarterLabel(iso: string | null): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  if (!m) return "";
  const year = m[1];
  const month = parseInt(m[2], 10);
  const q = Math.ceil(month / 3);
  const ord = q === 1 ? "1er" : `${q}e`;
  return `${ord} trimestre ${year}`;
}

export function mmYY(iso: string | null): string {
  const m = iso ? /^(\d{4})-(\d{2})/.exec(iso) : null;
  if (!m) return "0000";
  return `${m[2]}${m[1].slice(2)}`;
}

/** "Venise / Strasbourg" -> "Venise" ; "Tampa, États-Unis" -> "Tampa". */
export function tripSlug(source: string | null | undefined): string {
  if (!source) return "";
  const first = source.split(/[/,–>-]/)[0].trim();
  const cleaned = first.replace(/[^\p{L}\p{N} ]/gu, "").trim();
  const word = cleaned.split(/\s+/)[0] || cleaned;
  // Title-case so "STRASBOURG" and "strasbourg" collapse to one sheet name
  // (Excel sheet names are case-insensitive).
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function isGeneralExpense(r: ReceiptExtraction, deposit: DepositContext): boolean {
  // No trip signal at all -> Frais généraux (PRD §8 G3).
  const hasTrip = Boolean(deposit.tripHint || (r.location && r.location !== "—"));
  return !hasTrip;
}

export interface Routing {
  tripLabel: string;
  sheetName: string;
  period: string;
  lieu: string;
  traveler: string;
  travelerLabel: string;
  travelerSource: TravelerSource;
}

export function inferRouting(r: ReceiptExtraction, deposit: DepositContext): Routing {
  const general = isGeneralExpense(r, deposit);
  const period = deposit.period || quarterLabel(r.issueDate) || "";

  // traveler
  let traveler = "";
  let travelerSource: TravelerSource = "unresolved";
  if (r.passengers.length === 1) {
    traveler = r.passengers[0];
    travelerSource = "extracted";
  } else if (deposit.traveler) {
    traveler = deposit.traveler;
    travelerSource = "deduced";
  } else if (r.passengers.length > 1) {
    traveler = r.passengers[0];
    travelerSource = "extracted";
  }
  const travelerLabel = !traveler
    ? "Non renseigné — à préciser"
    : travelerSource === "deduced"
      ? `${traveler} (déduit du lot)`
      : traveler;
  if (!traveler) traveler = "Non renseigné — à préciser";

  if (general) {
    return {
      tripLabel: "Frais généraux",
      sheetName: "Frais_generaux",
      period,
      lieu: "—",
      traveler,
      travelerLabel,
      travelerSource,
    };
  }

  const hintSlug = tripSlug(deposit.tripHint) || tripSlug(r.location);
  const slug = hintSlug || "Voyage";
  const lieu = deposit.tripHint || r.location || "—";
  const tripLabel = deposit.tripHint || r.location || slug;
  const sheetName = `${slug}_${mmYY(r.issueDate)}`;

  return { tripLabel, sheetName, period, lieu, traveler, travelerLabel, travelerSource };
}

function dateLabel(iso: string | null): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export interface BuildInput {
  extraction: ReceiptExtraction;
  deposit: DepositContext;
  sourceFile: string;
  fileHash: string;
  fx: FxResult | null; // null when conversion failed OR currency EUR handled separately
  fxError?: string | null;
  id: string;
  /** Per-km rate read from the master's own `Kilométrage` cell (Q5), or null if unset. */
  mileageRate?: number | null;
}

export function buildProcessed(input: BuildInput): ProcessedExpense {
  const { extraction: r, deposit, fx, fxError, sourceFile, fileHash, id, mileageRate } = input;
  const routing = inferRouting(r, deposit);

  const reviewReasons: string[] = [];
  const conf = r.confidence;
  if (r.issueDate == null) reviewReasons.push("Date d'émission absente");
  if (r.amountTTC == null) reviewReasons.push("Montant absent");
  if (r.currency == null) reviewReasons.push("Devise absente");
  if (r.category == null) reviewReasons.push("Catégorie indéterminée");
  for (const [field, label] of [
    ["issueDate", "date"],
    ["amountTTC", "montant"],
    ["currency", "devise"],
    ["vendor", "fournisseur"],
    ["category", "catégorie"],
  ] as const) {
    if (conf[field] < CONFIDENCE_FLOOR) reviewReasons.push(`Confiance faible sur ${label} (${Math.round(conf[field] * 100)}%)`);
  }
  if (routing.travelerSource === "unresolved") reviewReasons.push("Voyageur non identifié");
  if (routing.travelerSource === "deduced") reviewReasons.push("Voyageur déduit du lot (à confirmer)");
  if (r.docNature === "booking" && !r.paymentProofPresent) reviewReasons.push("Réservation sans preuve de paiement claire");
  if (r.passengers.length > 1) reviewReasons.push(`Plusieurs passagers (${r.passengers.join(", ")})`);
  if (fx?.dateAdjusted) reviewReasons.push(`Taux du ${fx.rateDate} (jour ouvré précédent)`);
  if (fxError) reviewReasons.push(fxError);

  let amountEUR =
    r.currency === "EUR" ? r.amountTTC : fx ? fx.amountEUR : null;

  // Mileage with a real distance but no direct euro figure on the document:
  // compute the reimbursement from the workbook's own rate. Never invent a
  // rate — if Q5 is unset, leave amountEUR null and flag for Nathalie.
  let mileageComputed = false;
  if (r.category === "mileage" && r.distanceKm != null && amountEUR == null) {
    if (mileageRate != null) {
      amountEUR = Number((mileageRate * r.distanceKm).toFixed(2));
      mileageComputed = true;
    } else {
      reviewReasons.push("Barème kilométrique (Q5) non défini dans le fichier maître — impossible de calculer");
    }
  }

  return {
    id,
    sourceFile,
    fileHash,
    issueDate: r.issueDate,
    issueDateLabel: dateLabel(r.issueDate),
    issueDateRaw: r.issueDateRaw,
    vendor: r.vendor,
    category: r.category,
    docNature: r.docNature,
    paymentProofPresent: r.paymentProofPresent,
    docNumber: r.docNumber,
    location: r.location,
    purpose: r.purpose || deposit.purpose || null,
    etude: null, // not extracted (PRD: "often blank") — Nathalie fills it in during review
    passengers: r.passengers,
    originalAmount: r.amountTTC,
    originalCurrency: r.currency,
    vatRecoverable: r.vatRecoverable,
    amountEUR,
    fx,
    distanceKm: r.distanceKm,
    mileageComputed,
    traveler: routing.traveler,
    travelerSource: routing.travelerSource,
    tripLabel: routing.tripLabel,
    sheetName: routing.sheetName,
    period: routing.period,
    docKey: "", // filled by dedup
    duplicateOfId: null,
    idempotentSkip: false,
    mergedFromIds: [],
    confidence: r.confidence,
    needsReview: reviewReasons.length > 0,
    reviewReasons,
    alerts: r.alerts,
    locked: false,
    // carry travelerLabel via a getter-ish field on the sheet build; store on purpose in engine
  } as ProcessedExpense;
}
