/**
 * Fixture data for the "Expense reports" demo (`/expenses`).
 *
 * Each entry mirrors a *real* receipt already sitting in the shared
 * `/finance` sample folder, with the extraction/conversion result a live
 * pipeline would produce, pre-computed so the demo can run end to end
 * without a real vision call or a live FX API (see the "Demo mode" notice
 * on the page). Matching a dropped file to a fixture is done purely by
 * filename, on purpose, so this stays a demo-only lookup table.
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

/** Ordered exactly as the columns appear in Matrice LM_0226_rembt Frais.xlsx. */
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
  objet: string;
  lieu: string;
  period: string;
}

export interface ExpenseReceiptFixture {
  id: string;
  /** lowercase filename fragments; a dropped file matches if its name includes any of these */
  matchNames: string[];
  vendor: string;
  invoiceDate: string; // ISO, for sorting
  invoiceDateLabel: string; // French dd/mm/yyyy, for display
  category: ExpenseCategory;
  originalAmount: number;
  originalCurrency: "EUR" | "JPY" | "DKK";
  fxRate?: number; // units of originalCurrency per 1 EUR
  fxRateSource?: string;
  vatRecoverable?: number; // EUR, memo only — not added into the row Total
  minutesSaved: number;
  trip: ExpenseTrip;
}

const VENISE_TRIP: ExpenseTrip = {
  id: "venise-0326",
  label: "Venise ↔ Strasbourg",
  sheetName: "Venise_0326",
  etude: "GEPROMED",
  objet: "Déplacement professionnel",
  lieu: "Venise / Strasbourg",
  period: "1er trimestre 2026",
};

const NAGOYA_TRIP: ExpenseTrip = {
  id: "nagoya-0726",
  label: "Nagoya",
  sheetName: "Nagoya_0726",
  etude: "GEPROMED",
  objet: "Congrès / mission",
  lieu: "Nagoya, Japon",
  period: "3e trimestre 2026",
};

const TAMPA_TRIP: ExpenseTrip = {
  id: "tampa-0226",
  label: "Tampa",
  sheetName: "Tampa_0226",
  etude: "GEPROMED",
  objet: "Déplacement professionnel",
  lieu: "Tampa, États-Unis",
  period: "1er trimestre 2026",
};

const STRASBOURG_TRIP: ExpenseTrip = {
  id: "strasbourg-0526",
  label: "Strasbourg — déplacement local",
  sheetName: "Strasbourg_0526",
  etude: "GEPROMED",
  objet: "Stationnement gare, déplacement professionnel",
  lieu: "Strasbourg",
  period: "2e trimestre 2026",
};

export const KNOWN_RECEIPTS: ExpenseReceiptFixture[] = [
  {
    id: "venice-strasbourg-flight",
    matchNames: ["flight tickets venice-strasbourg", "2202242138164"],
    vendor: "Lufthansa — billet Venise ↔ Strasbourg",
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
    invoiceDate: "2026-03-18",
    invoiceDateLabel: "18/03/2026",
    category: "Train / Métro",
    originalAmount: 12.0,
    originalCurrency: "EUR",
    minutesSaved: 4,
    trip: VENISE_TRIP,
  },
  {
    id: "strasbourg-cts-tram",
    matchNames: ["strasbourg bus 03"],
    vendor: "CTS — tickets tram/bus Strasbourg (x2)",
    invoiceDate: "2026-03-18",
    invoiceDateLabel: "18/03/2026",
    category: "Train / Métro",
    originalAmount: 4.2,
    originalCurrency: "EUR",
    vatRecoverable: 0.38,
    minutesSaved: 4,
    trip: VENISE_TRIP,
  },
  {
    id: "nagoya-hotel",
    matchNames: ["reservation_hotel_1"],
    vendor: "Hotel Keihan Nagoya (via Booking.com)",
    invoiceDate: "2026-07-01",
    invoiceDateLabel: "01/07/2026",
    category: "Hébergement",
    originalAmount: 77074,
    originalCurrency: "JPY",
    fxRate: 186.19,
    fxRateSource: "taux de référence BCE",
    minutesSaved: 9,
    trip: NAGOYA_TRIP,
  },
  {
    id: "tampa-flight",
    matchNames: ["tampa"],
    vendor: "Air France / Delta — billet Copenhague ↔ Tampa",
    invoiceDate: "2026-02-03",
    invoiceDateLabel: "03/02/2026",
    category: "Billet d'avion",
    originalAmount: 8852,
    originalCurrency: "DKK",
    fxRate: 7.46,
    fxRateSource: "taux de référence BCE",
    minutesSaved: 9,
    trip: TAMPA_TRIP,
  },
  {
    id: "effia-parking",
    matchNames: ["effia", "13626376"],
    vendor: "EFFIA — parking gare de Strasbourg Sainte-Aurélie",
    invoiceDate: "2026-06-03",
    invoiceDateLabel: "03/06/2026",
    category: "Parking",
    originalAmount: 91.0,
    originalCurrency: "EUR",
    vatRecoverable: 15.17,
    minutesSaved: 5,
    trip: STRASBOURG_TRIP,
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

export function groupByTrip(
  receipts: ExpenseReceiptFixture[],
): { trip: ExpenseTrip; receipts: ExpenseReceiptFixture[]; totalEur: number }[] {
  const byId = new Map<string, { trip: ExpenseTrip; receipts: ExpenseReceiptFixture[] }>();
  for (const r of receipts) {
    const existing = byId.get(r.trip.id);
    if (existing) existing.receipts.push(r);
    else byId.set(r.trip.id, { trip: r.trip, receipts: [r] });
  }
  return Array.from(byId.values()).map((g) => ({
    ...g,
    totalEur: g.receipts.reduce((sum, r) => sum + eurAmountOf(r), 0),
  }));
}
