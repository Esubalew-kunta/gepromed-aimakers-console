import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSessionUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "sponsor-logos";
const MAX_LOGO_BYTES = 4 * 1024 * 1024; // 4 MB
const OK_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"]);

interface SponsorRow {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
}
const toSponsor = (r: SponsorRow) => ({ id: r.id, name: r.name, logoUrl: r.logo_url, website: r.website_url ?? "" });

/** GET — the reusable sponsor library (for the picker). Any authenticated user. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const sb = supabaseServer();
  if (!sb) return NextResponse.json({ sponsors: [] });
  const { data, error } = await sb
    .from("sponsors")
    .select("id, name, logo_url, website_url")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sponsors: (data as SponsorRow[]).map(toSponsor) });
}

/**
 * POST — add a new sponsor to the library (admin only). Multipart:
 *   logo (File, required), name (required), website (optional).
 * Uploads the logo to the public sponsor-logos bucket, stores the public URL,
 * and returns the created sponsor so the client can select it immediately.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  const sb = supabaseServer();
  if (!sb) return NextResponse.json({ error: "Base de données non configurée." }, { status: 400 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide (multipart attendu)." }, { status: 400 });
  }

  const name = String(form.get("name") || "").trim();
  if (!name) return NextResponse.json({ error: "Le nom du sponsor est requis." }, { status: 400 });
  const website = String(form.get("website") || "").trim();

  const logo = form.get("logo");
  if (!(logo instanceof File) || logo.size === 0) {
    return NextResponse.json({ error: "Le logo est requis." }, { status: 400 });
  }
  if (logo.size > MAX_LOGO_BYTES) {
    return NextResponse.json({ error: `Logo trop volumineux (max ${MAX_LOGO_BYTES / (1024 * 1024)} Mo).` }, { status: 400 });
  }
  const type = logo.type || "image/png";
  if (!OK_TYPES.has(type)) {
    return NextResponse.json({ error: "Format de logo non pris en charge (PNG, JPG, WebP, SVG, GIF)." }, { status: 400 });
  }

  const ext = (logo.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `${randomUUID()}.${ext}`;
  try {
    const buf = Buffer.from(await logo.arrayBuffer());
    const { error: upErr } = await sb.storage.from(BUCKET).upload(path, buf, { contentType: type, upsert: true });
    if (upErr) return NextResponse.json({ error: `Échec du téléversement du logo : ${upErr.message}` }, { status: 500 });
    const logo_url = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    const { data, error } = await sb
      .from("sponsors")
      .insert({ name, logo_url, website_url: website || null })
      .select("id, name, logo_url, website_url")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, sponsor: toSponsor(data as SponsorRow) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
