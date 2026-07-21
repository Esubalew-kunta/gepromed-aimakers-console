// One-off test: exercise the app's convertToEUR() logic directly (same
// providers/order as src/lib/expenses/fx.ts) without going through Next.js,
// to verify real API calls, weekend-date resolution, and rounding.
import { readFileSync } from "node:fs";

function loadEnv() {
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) process.env[m[1]] ??= m[2].trim();
  }
}
loadEnv();

const FRANKFURTER = "https://api.frankfurter.dev/v1";
const CURRENCYBEACON = "https://api.currencybeacon.com/v1";
const FALLBACK_KEY = process.env.FX_FALLBACK_API_KEY;

async function fromFrankfurter(currency, date) {
  const url = `${FRANKFURTER}/${date}?base=${encodeURIComponent(currency)}&symbols=EUR`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const eurPerUnit = json.rates?.EUR;
  if (!eurPerUnit || !json.date) return null;
  return { rate: 1 / eurPerUnit, quoteDate: json.date, source: "ECB (Frankfurter)" };
}

async function fromCurrencyBeacon(currency, date) {
  if (!FALLBACK_KEY) return null;
  const url = `${CURRENCYBEACON}/historical?api_key=${FALLBACK_KEY}&base=EUR&date=${date}&symbols=${encodeURIComponent(currency)}`;
  const res = await fetch(url);
  if (!res.ok) return { httpStatus: res.status, body: await res.text() };
  const json = await res.json();
  const rates = json.response?.rates ?? json.rates;
  const unitsPerEur = rates?.[currency];
  if (!unitsPerEur) return { raw: json };
  const quoteDate = json.response?.date ?? json.date ?? date;
  return { rate: unitsPerEur, quoteDate, source: "CurrencyBeacon" };
}

const cases = [
  { amount: 100, currency: "USD", date: "2026-03-14" }, // Tampa (US), weekday
  { amount: 250, currency: "USD", date: "2026-03-15" }, // weekend -> should roll back
  { amount: 50, currency: "GBP", date: "2026-01-05" },
  { amount: 1000, currency: "AED", date: "2026-02-10" }, // not in ECB set -> forces fallback
];

for (const c of cases) {
  console.log(`\n--- ${c.amount} ${c.currency} on ${c.date} ---`);
  const fr = await fromFrankfurter(c.currency, c.date);
  console.log("Frankfurter (primary):", fr);
  if (!fr) {
    const cb = await fromCurrencyBeacon(c.currency, c.date);
    console.log("CurrencyBeacon (fallback):", cb);
  }
  const raw = fr;
  if (raw) {
    const amountEUR = Math.round((c.amount / raw.rate) * 100) / 100;
    console.log(`=> ${c.amount} ${c.currency} = ${amountEUR} EUR (rate ${raw.rate.toFixed(6)}, quoteDate ${raw.quoteDate}, dateAdjusted=${raw.quoteDate !== c.date})`);
  }
}
