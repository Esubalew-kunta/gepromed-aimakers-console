"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export interface CourseFormState {
  error?: string;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "session"
  );
}

const str = (fd: FormData, k: string) => String(fd.get(k) || "").trim();
const num = (fd: FormData, k: string, d = 0) => {
  const v = Number(fd.get(k));
  return Number.isFinite(v) ? v : d;
};
const optNum = (fd: FormData, k: string): number | null => {
  const raw = String(fd.get(k) || "").trim();
  if (!raw) return null;
  const v = Number(raw);
  return Number.isFinite(v) ? v : null;
};

export async function saveCourse(
  _prev: CourseFormState,
  fd: FormData,
): Promise<CourseFormState> {
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in again." };
  const sb = supabaseServer();
  if (!sb) return { error: "Supabase is not configured." };

  const titleFr = str(fd, "title_fr");
  if (!titleFr) return { error: "The French title is required." };

  let objectives: unknown, program: unknown, supervisors: unknown;
  try {
    objectives = JSON.parse(str(fd, "objectives") || "[]");
    program = JSON.parse(str(fd, "program") || "[]");
    supervisors = JSON.parse(str(fd, "supervisors") || "[]");
    if (![objectives, program, supervisors].every(Array.isArray)) throw new Error();
  } catch {
    return { error: "Objectives, program and supervisors must be valid JSON arrays." };
  }

  // Image: upload a new file if provided, else keep the existing URL.
  let image_url: string | null = str(fd, "image_url_existing") || null;
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `course-${Date.now()}.${ext}`;
    const { error: upErr } = await sb.storage
      .from("course-images")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) return { error: `Image upload failed: ${upErr.message}` };
    image_url = sb.storage.from("course-images").getPublicUrl(path).data.publicUrl;
  }

  const start = str(fd, "start_date");
  const row = {
    title: { fr: titleFr, en: str(fd, "title_en") },
    specialty: str(fd, "specialty") || "vascular",
    level: str(fd, "level") || "Initiation",
    audience: str(fd, "audience") || "France",
    city: str(fd, "city"),
    venue: { fr: str(fd, "venue_fr"), en: str(fd, "venue_en") },
    start_date: start || null,
    end_date: str(fd, "end_date") || start || null,
    duration_days: num(fd, "duration_days", 1),
    price_eur: num(fd, "price_eur"),
    deposit_eur: num(fd, "deposit_eur"),
    capacity: num(fd, "capacity"),
    qualiopi: fd.get("qualiopi") != null,
    summary: { fr: str(fd, "summary_fr"), en: str(fd, "summary_en") },
    objectives,
    program,
    supervisors,
    satisfaction: optNum(fd, "satisfaction"),
    pass_rate: optNum(fd, "pass_rate"),
    photos: optNum(fd, "photos"),
    status: str(fd, "status") || "open",
  };

  // Only write image_url when we actually have one — so course saves keep
  // working even before db/course_images.sql adds the column.
  const payload = image_url !== null ? { ...row, image_url } : row;

  const editingSlug = str(fd, "__slug");
  if (editingSlug) {
    const { error } = await sb.from("trainings").update(payload).eq("slug", editingSlug);
    if (error) return { error: error.message };
  } else {
    const slug = `${slugify(titleFr)}-${(start || "2026-01").slice(0, 7)}`;
    const { error } = await sb.from("trainings").insert({ ...payload, slug });
    if (error) return { error: error.message };
  }

  revalidatePath("/courses");
  redirect("/courses");
}

export async function deleteCourse(slug: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  const sb = supabaseServer();
  if (!sb) return;
  await sb.from("trainings").delete().eq("slug", slug);
  revalidatePath("/courses");
  redirect("/courses");
}
