/**
 * Fixture data for the "Expense reports" demo (`/expenses`).
 *
 * Each entry mirrors a *real* receipt from the shared 11-file test set
 * (`/finance`, per the Gepromed PRD "Expense Notes" appendix), with the
 * extraction/conversion/routing result a live pipeline would produce,
 * pre-computed so the demo runs end to end without a real vision call or a
 * live FX API (see the "Demo mode" notice on the page). Matching a dropped
 * file to a fixture is done purely by filename, on purpose — this is a
 * demo-only lookup table, not the real extraction pipeline.
 *
 * Also encodes the PRD's named edge cases so the demo shows the pipeline
 * actually handling them, not just the happy path:
 * - duplicate ticket detection (same fiscal document, two files) — PRD §8 E1
 * - one file containing several line items (2 CTS tickets) — PRD §11 J1
 * - booking confirmation + payment receipt of the same stay merging into
 *   one line, using the amount actually paid — PRD §8 F2
 * - multi-passenger ticket → included, flagged — PRD §8 J2
 * - non-trip expense routed to a "Frais généraux" sheet — PRD §8 G3
 */

export type ExpenseCategory =
  | "Billet d'avion"
  | "Hébergement"
  | "Train / Métro"
  | "Taxi"
  | "Autoroute"
  | "Parking"
  | "Repas et pourboires"
  | "Conférences et séminaires"
  | "Divers";

/** Ordered exactly as the columns appear in Matrice LM_0226_rembt Frais.xlsx (row 13, B→S). */
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Billet d'avion",
  "Hébergement",
  "Train / Métro",
  "Taxi",
  "Autoroute",
  "Parking",
  "Repas et pourboires",
  "Conférences et séminaires",
  "Divers",
];

export interface ExpenseTrip {
  id: string;
  label: string;
  sheetName: string;
  etude: string;
  lieu: string;
  period: string;
  traveler: string;
  /** "extracted" = read directly off a receipt in this trip; "deduced" = inferred from the batch, no receipt names it. */
  travelerSource: "extracted" | "deduced" | "unresolved";
}

export interface ExpenseReceiptFixture {
  id: string;
  /** lowercase filename fragments; a dropped file matches if its name includes any of these */
  matchNames: string[];
  vendor: string;
  invoiceDate: string; // ISO, for sorting — the *issue* date (PRD rule B1), not travel/print date
  invoiceDateLabel: string; // French dd/mm/yyyy, for display
  category: ExpenseCategory;
  originalAmount: number;
  originalCurrency: "EUR" | "JPY" | "DKK";
  fxRate?: number; // units of originalCurrency per 1 EUR
  fxRateSource?: string;
  vatRecoverable?: number; // EUR, memo only — not added into the row Total
  minutesSaved: number;
  trip: ExpenseTrip;
  /** >1 when one file legally contains several identical line items (e.g. 2 tram tickets in 1 PDF). */
  lineCount?: number;
  /** Fixtures sharing a mergeGroup are the SAME underlying expense; only the primary contributes a line when both are present. */
  mergeGroup?: string;
  isMergePrimary?: boolean;
  mergeNote?: string;
  /** A standing alert shown regardless of dedup (e.g. multi-passenger ticket). */
  alert?: string;
  objet: string;
}

const VENISE_TRIP: ExpenseTrip = {
  id: "venise-0326",
  label: "Venise ↔ Strasbourg",
  sheetName: "Venise_0326",
  etude: "GEPROMED",
  lieu: "Venise / Strasbourg",
  period: "1er trimestre 2026",
  traveler: "Cristina Rocchi",
  travelerSource: "extracted",
};

const JAPAN_TRIP: ExpenseTrip = {
  id: "japon-0726",
  label: "Paris ↔ Tokyo / Nagoya",
  sheetName: "Japon_0726",
  etude: "GEPROMED",
  lieu: "Tokyo / Nagoya, Japon",
  period: "3e trimestre 2026",
  traveler: "Noé Constans",
  travelerSource: "extracted",
};

const TAMPA_TRIP: ExpenseTrip = {
  id: "tampa-0226",
  label: "Copenhague ↔ Tampa",
  sheetName: "Tampa_0226",
  etude: "GEPROMED",
  lieu: "Tampa, États-Unis",
  period: "1er trimestre 2026",
  traveler: "Jes Sanddal Lindholt",
  travelerSource: "extracted",
};

const CAIRO_TRIP: ExpenseTrip = {
  id: "caire-0426",
  label: "Strasbourg ↔ Le Caire",
  sheetName: "Caire_0426",
  etude: "GEPROMED",
  lieu: "Paris / Le Caire",
  period: "2e trimestre 2026",
  traveler: "Nabil Chakfé",
  travelerSource: "extracted",
};

/** PRD §8 G3: expenses with no identifiable trip route to a standing "Frais généraux" sheet. */
const GENERAL_TRIP: ExpenseTrip = {
  id: "frais-generaux",
  label: "Frais généraux",
  sheetName: "Frais_generaux",
  etude: "GEPROMED",
  lieu: "—",
  period: "2e trimestre 2026",
  traveler: "Non renseigné",
  travelerSource: "unresolved",
};

export const KNOWN_RECEIPTS: ExpenseReceiptFixture[] = [
  // --- Venise ↔ Strasbourg (Cristina Rocchi) ---
  {
    id: "venice-strasbourg-flight",
    matchNames: ["flight tickets venice-strasbourg", "2202242138164"],
    vendor: "Lufthansa — billet Venise ↔ Strasbourg",
    objet: "Déplacement professionnel",
    invoiceDate: "2026-03-18",
    invoiceDateLabel: "18/03/2026",
    category: "Billet d'avion",
    originalAmount: 315.8,
    originalCurrency: "EUR",
    minutesSaved: 4,
    trip: VENISE_TRIP,
  },
  {
    id: "venice-airport-bus",
    matchNames: ["bus venice airport"],
    vendor: "ATVO — navette Mestre ↔ Aéroport Marco Polo",
    objet: "Déplacement professionnel",
    invoiceDate: "2026-03-18",
    invoiceDateLabel: "18/03/2026",
    category: "Train / Métro",
    originalAmount: 12.0,
    originalCurrency: "EUR",
    minutesSaved: 4,
    trip: VENISE_TRIP,
  },
  {
    id: "belluno-venezia-train",
    matchNames: ["train belluno venice", "belluno"],
    vendor: "Trenitalia — Belluno ↔ Venezia Mestre",
    objet: "Déplacement professionnel",
    invoiceDate: "2026-03-18",
    invoiceDateLabel: "18/03/2026",
    category: "Train / Métro",
    originalAmount: 9.0,
    originalCurrency: "EUR",
    minutesSaved: 4,
    trip: VENISE_TRIP,
  },
  {
    id: "strasbourg-cts-tram",
    matchNames: ["strasbourg bus 03"],
    vendor: "CTS — ticket tram/bus Strasbourg",
    objet: "Déplacement professionnel",
    invoiceDate: "2026-03-18",
    invoiceDateLabel: "18/03/2026",
    category: "Train / Métro",
    originalAmount: 2.1,
    originalCurrency: "EUR",
    vatRecoverable: 0.19,
    lineCount: 2,
    minutesSaved: 5,
    trip: VENISE_TRIP,
  },

  // --- Paris ↔ Tokyo / Nagoya (Noé Constans) ---
  {
    id: "japan-flight",
    matchNames: ["reservation_vol"],
    vendor: "Trip.com / Cathay Pacific — Paris ↔ Tokyo (via Hong Kong)",
    objet: "Congrès / mission",
    invoiceDate: "2026-03-09",
    invoiceDateLabel: "09/03/2026",
    category: "Billet d'avion",
    originalAmount: 1083.34,
    originalCurrency: "EUR",
    minutesSaved: 5,
    trip: JAPAN_TRIP,
  },
  {
    id: "nagoya-hotel-booking",
    matchNames: ["reservation_hotel_1"],
    vendor: "Hotel Keihan Nagoya — confirmation (Booking.com)",
    objet: "Congrès / mission",
    invoiceDate: "2026-07-01",
    invoiceDateLabel: "01/07/2026",
    category: "Hébergement",
    originalAmount: 77074,
    originalCurrency: "JPY",
    fxRate: 186.19,
    fxRateSource: "taux de référence BCE",
    minutesSaved: 9,
    trip: JAPAN_TRIP,
    mergeGroup: "nagoya-hotel",
    mergeNote:
      'réservation 5420712528 — confirmation de réservation seule, pas encore de preuve de paiement',
  },
  {
    id: "nagoya-hotel-payment",
    matchNames: ["reservation_hotel_2"],
    vendor: "Hotel Keihan Nagoya — reçu de paiement (Booking.com)",
    objet: "Congrès / mission",
    invoiceDate: "2026-03-31",
    invoiceDateLabel: "31/03/2026",
    category: "Hébergement",
    originalAmount: 69367,
    originalCurrency: "JPY",
    fxRate: 163.92,
    fxRateSource: "taux de référence BCE",
    minutesSaved: 9,
    trip: JAPAN_TRIP,
    mergeGroup: "nagoya-hotel",
    isMergePrimary: true,
    mergeNote:
      'réservation 5420712528 — confirmation + reçu de paiement du même séjour, fusionnés en une ligne (montant réellement payé)',
  },

  // --- Copenhague ↔ Tampa (Jes Sanddal Lindholt) ---
  {
    id: "tampa-flight",
    matchNames: ["tampa"],
    vendor: "Air France / Delta — billet Copenhague ↔ Tampa",
    objet: "Déplacement professionnel",
    invoiceDate: "2026-02-03",
    invoiceDateLabel: "03/02/2026",
    category: "Billet d'avion",
    originalAmount: 8852,
    originalCurrency: "DKK",
    fxRate: 7.46,
    fxRateSource: "taux de référence BCE",
    minutesSaved: 9,
    trip: TAMPA_TRIP,
    alert:
      "2 passagers sur ce billet (Jes Sanddal Lindholt + Henriette Lindholt) — les deux inclus, à vérifier si une répartition est nécessaire.",
  },

  // --- Strasbourg ↔ Le Caire (Nabil Chakfé, président) ---
  {
    id: "cairo-flight",
    matchNames: ["factureairfrance"],
    vendor: "Air France — Strasbourg / Paris / Le Caire / Paris / Strasbourg",
    objet: "Déplacement professionnel",
    invoiceDate: "2026-04-26",
    invoiceDateLabel: "26/04/2026",
    category: "Billet d'avion",
    originalAmount: 1081.99,
    originalCurrency: "EUR",
    minutesSaved: 6,
    trip: CAIRO_TRIP,
  },

  // --- Frais généraux (no identifiable trip — PRD §8 G3) ---
  {
    id: "effia-parking",
    matchNames: ["effia", "13626376"],
    vendor: "EFFIA — parking gare de Strasbourg Sainte-Aurélie",
    objet: "Stationnement gare, déplacement professionnel",
    invoiceDate: "2026-06-03",
    invoiceDateLabel: "03/06/2026",
    category: "Parking",
    originalAmount: 91.0,
    originalCurrency: "EUR",
    vatRecoverable: 15.17,
    minutesSaved: 5,
    trip: GENERAL_TRIP,
  },
];

export function matchReceipt(fileName: string): ExpenseReceiptFixture | undefined {
  const lower = fileName.toLowerCase();
  return KNOWN_RECEIPTS.find((r) => r.matchNames.some((m) => lower.includes(m)));
}

/** EUR value of a receipt, converted at its recorded rate when foreign. */
export function eurAmountOf(r: ExpenseReceiptFixture): number {
  if (r.originalCurrency === "EUR" || !r.fxRate) return r.originalAmount;
  return Math.round((r.originalAmount / r.fxRate) * 100) / 100;
}

/** The manual formula Nathalie would have typed by hand, e.g. "=8852/7.46". */
export function manualFormulaOf(r: ExpenseReceiptFixture): string | null {
  if (r.originalCurrency === "EUR" || !r.fxRate) return null;
  return `=${r.originalAmount}/${r.fxRate}`;
}

export function formatOriginalAmount(r: ExpenseReceiptFixture): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: r.originalCurrency,
    maximumFractionDigits: r.originalCurrency === "JPY" ? 0 : 2,
  }).format(r.originalAmount);
}

export function formatEUR(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

/**
 * Expands a fixture into its actual number of expense lines (PRD §11 J1: one
 * file can legally contain several line items, e.g. 2 tram tickets).
 */
export function expandLines(r: ExpenseReceiptFixture): ExpenseReceiptFixture[] {
  const count = r.lineCount ?? 1;
  if (count <= 1) return [r];
  return Array.from({ length: count }, (_, i) => ({ ...r, id: `${r.id}#${i + 1}` }));
}

export function groupByTrip(
  receipts: ExpenseReceiptFixture[],
): { trip: ExpenseTrip; receipts: ExpenseReceiptFixture[]; totalEur: number }[] {
  const byId = new Map<string, { trip: ExpenseTrip; receipts: ExpenseReceiptFixture[] }>();
  for (const base of receipts) {
    for (const r of expandLines(base)) {
      const existing = byId.get(r.trip.id);
      if (existing) existing.receipts.push(r);
      else byId.set(r.trip.id, { trip: r.trip, receipts: [r] });
    }
  }
  return Array.from(byId.values()).map((g) => ({
    ...g,
    totalEur: g.receipts.reduce((sum, r) => sum + eurAmountOf(r), 0),
  }));
}
