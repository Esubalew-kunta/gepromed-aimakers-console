import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Clears every data row in the live Google Sheet (headers/banner/running-total
 * formula untouched). Best-effort: never throws — a missing/unreachable n8n
 * webhook shouldn't block the DB clear from completing.
 */
async function clearGoogleSheet(): Promise<boolean> {
  const url = process.env.EXPENSE_SHEET_CLEAR_URL;
  if (!url) return false;
  try {
    const res = await fetch(url, { method: "POST" });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Clears the ENTIRE expense audit DB (expense_runs + expense_receipts, which
 * cascade on run_id) for every user, AND the live Google Sheet's data rows —
 * both reset together so "Effacer toutes les données" is a real fresh start
 * everywhere. Never touches the saved master workbook in storage.
 *
 * Deliberately unscoped (not filtered to the current user): the Google Sheet
 * clear has always wiped the whole shared sheet for everyone, and the
 * confirmation modal's own copy already promises exactly that ("vide toutes
 * les lignes du Google Sheet partagé... irréversible pour tout le monde
 * utilisant ce Sheet"). Scoping the DB delete to `created_by` broke that
 * promise: with multiple users committing batches, clicking the button only
 * deleted the clicking user's own runs while the Sheet was wiped for
 * everyone — looking exactly like "it only cleared the Sheet, not the DB."
 * Admin-only given the blast radius.
 *
 * The master workbook is deliberately NOT touched — it's only an extraction
 * template now, not a data store. After a clear, the preview (which reads the
 * database) shows just the headers with a €0.00 total.
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }

  const sb = supabaseServer();
  if (!sb) return NextResponse.json({ error: "Base de données non configurée." }, { status: 400 });

  try {
    const { error, count } = await sb
      .from("expense_runs")
      .delete({ count: "exact" })
      .not("id", "is", null); // unconditional delete-all; Supabase requires an explicit filter
    if (error) throw error;
    const sheetCleared = await clearGoogleSheet();
    return NextResponse.json({ ok: true, deletedRuns: count ?? 0, sheetCleared });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
