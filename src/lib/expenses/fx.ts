import "server-only";
import type { FxResult } from "./types";
import { supabaseServer } from "@/lib/supabase";

/**
 * Currency conversion at the receipt's ISSUE DATE (never the current date).
 *
 * Primary: ECB reference rates via Frankfurter (frankfurter.dev) — official,
 * free, no key. Weekend/holiday dates auto-resolve to the prior business day
 * and the API tells us which date it used.
 * Fallback: CurrencyBeacon (keyed) for currencies ECB doesn't publish (AED…).
 *
 * NEVER guess: if neither source returns a rate, we throw FxUnavailableError
 * and the caller flags the line "à vérifier par Nathalie" — no invented rate.
 *
 * Rates are cached in Supabase (fx_rate_cache) and per-process, so an audit is
 * reproducible and we stay within provider limits. `rate` = original units per
 * 1 EUR (e.g. 7.4688 DKK/EUR).
 */

export class FxUnavailableError extends Error {
  constructor(public currency: string, public date: string) {
    super(`Taux de change indisponible pour ${currency} au ${date}`);
    this.name = "FxUnavailableError";
  }
}

const FRANKFURTER = "https://api.frankfurter.dev/v1";
const CURRENCYBEACON = "https://api.currencybeacon.com/v1";
const FALLBACK_KEY = process.env.FX_FALLBACK_API_KEY;

// per-process memo so a batch with many same-day/currency lines hits the net once
const memo = new Map<string, FxResult>();

function round(n: number, dp = 6): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

interface RawRate {
  rate: number; // original units per 1 EUR
  quoteDate: string; // actual date used
  source: string;
}

// ---- providers ----

async function fromFrankfurter(currency: string, date: string): Promise<RawRate | null> {
  try {
    const url = `${FRANKFURTER}/${date}?base=${encodeURIComponent(currency)}&symbols=EUR`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { date?: string; rates?: { EUR?: number } };
    const eurPerUnit = json.rates?.EUR;
    if (!eurPerUnit || !json.date) return null; // currency not in ECB set
    return { rate: 1 / eurPerUnit, quoteDate: json.date, source: "ECB (Frankfurter)" };
  } catch {
    return null;
  }
}

async function fromCurrencyBeacon(currency: string, date: string): Promise<RawRate | null> {
  if (!FALLBACK_KEY) return null;
  try {
    const url =
      `${CURRENCYBEACON}/historical?api_key=${FALLBACK_KEY}` +
      `&base=EUR&date=${date}&symbols=${encodeURIComponent(currency)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      meta?: { code?: number };
      response?: { date?: string; rates?: Record<string, number> };
      rates?: Record<string, number>;
      date?: string;
    };
    const rates = json.response?.rates ?? json.rates;
    const unitsPerEur = rates?.[currency];
    if (!unitsPerEur) return null;
    const quoteDate = json.response?.date ?? json.date ?? date;
    return { rate: unitsPerEur, quoteDate, source: "CurrencyBeacon" };
  } catch {
    return null;
  }
}

// ---- cache ----

async function cacheGet(currency: string, date: string): Promise<RawRate | null> {
  const sb = supabaseServer();
  if (!sb) return null;
  try {
    const { data } = await sb
      .from("fx_rate_cache")
      .select("rate, quote_date, source")
      .eq("rate_date", date)
      .eq("currency", currency)
      .limit(1)
      .maybeSingle();
    if (data && typeof data.rate === "number") {
      return { rate: data.rate, quoteDate: data.quote_date ?? date, source: data.source };
    }
  } catch {
    /* cache is best-effort */
  }
  return null;
}

async function cachePut(currency: string, date: string, r: RawRate): Promise<void> {
  const sb = supabaseServer();
  if (!sb) return;
  try {
    await sb.from("fx_rate_cache").upsert(
      { rate_date: date, currency, source: r.source, rate: r.rate, quote_date: r.quoteDate },
      { onConflict: "rate_date,currency,source" },
    );
  } catch {
    /* best-effort */
  }
}

// ---- public API ----

export async function convertToEUR(
  amount: number,
  currency: string,
  issueDate: string,
): Promise<FxResult> {
  const cur = currency.toUpperCase().trim();
  if (cur === "EUR") {
    return {
      amountEUR: round(amount, 2),
      rate: 1,
      rateDate: issueDate,
      requestedDate: issueDate,
      source: "—",
      originalAmount: amount,
      originalCurrency: "EUR",
      dateAdjusted: false,
    };
  }

  const key = `${cur}@${issueDate}`;
  const cached = memo.get(key);
  const raw =
    (cached
      ? { rate: cached.rate, quoteDate: cached.rateDate, source: cached.source }
      : null) ??
    (await cacheGet(cur, issueDate)) ??
    (await fromFrankfurter(cur, issueDate)) ??
    (await fromCurrencyBeacon(cur, issueDate));

  if (!raw) throw new FxUnavailableError(cur, issueDate);

  if (!cached) await cachePut(cur, issueDate, raw);

  const result: FxResult = {
    amountEUR: round(amount / raw.rate, 2),
    rate: round(raw.rate, 6),
    rateDate: raw.quoteDate,
    requestedDate: issueDate,
    source: raw.source,
    originalAmount: amount,
    originalCurrency: cur,
    dateAdjusted: raw.quoteDate !== issueDate,
  };
  memo.set(key, result);
  return result;
}
