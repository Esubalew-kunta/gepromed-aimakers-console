"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { validateImageFile } from "@/lib/file-validation";

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

const MAX_GALLERY_PHOTOS = 12;

/** course-images is a public bucket, so what we store is the full public
 * URL — recover the bucket-relative path from it so we can pass it to
 * storage.remove(). Returns null for anything that isn't actually a
 * course-images URL (nothing to clean up). */
function coursePhotoPath(url: string): string | null {
  const marker = "/storage/v1/object/public/course-images/";
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

/** Best-effort storage cleanup — never blocks or fails the caller. A
 * leftover orphaned file is a minor storage-cost annoyance; failing a save
 * or delete over it would be a much worse trade. */
async function cleanupCourseStorage(
  sb: ReturnType<typeof supabaseServer>,
  files: { imageUrl?: string | null; photos?: string[]; workbookPath?: string | null },
): Promise<void> {
  if (!sb) return;
  const imagePaths = [
    ...(files.imageUrl ? [coursePhotoPath(files.imageUrl)] : []),
    ...(files.photos ?? []).map(coursePhotoPath),
  ].filter((p): p is string => Boolean(p));
  if (imagePaths.length) {
    await sb.storage.from("course-images").remove(imagePaths).catch(() => {});
  }
  if (files.workbookPath) {
    await sb.storage.from("program-workbooks").remove([files.workbookPath]).catch(() => {});
  }
}

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

  // Fetch the current stored files (if editing) up front, so replaced/
  // removed cover image, gallery photos and workbook can be cleaned out of
  // Storage after the save succeeds instead of being silently orphaned.
  const editingSlug = str(fd, "__slug");
  let oldFiles: { image_url: string | null; photos: string[] | null; program_workbook_path: string | null } | null = null;
  if (editingSlug) {
    const { data } = await sb
      .from("trainings")
      .select("image_url, photos, program_workbook_path")
      .eq("slug", editingSlug)
      .maybeSingle();
    oldFiles = data ?? null;
  }

  let objectives: unknown, program: unknown, supervisors: unknown, sponsors: unknown;
  try {
    objectives = JSON.parse(str(fd, "objectives") || "[]");
    program = JSON.parse(str(fd, "program") || "[]");
    supervisors = JSON.parse(str(fd, "supervisors") || "[]");
    sponsors = JSON.parse(str(fd, "sponsors") || "[]");
    if (![objectives, program, supervisors, sponsors].every(Array.isArray)) throw new Error();
  } catch {
    return { error: "Objectives, program, supervisors and sponsors must be valid JSON arrays." };
  }

  // Image: upload a new file if provided, else keep the existing URL.
  let image_url: string | null = str(fd, "image_url_existing") || null;
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    const fileError = validateImageFile(file);
    if (fileError) return { error: fileError };
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `course-${Date.now()}.${ext}`;
    const { error: upErr } = await sb.storage
      .from("course-images")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) return { error: `Image upload failed: ${upErr.message}` };
    image_url = sb.storage.from("course-images").getPublicUrl(path).data.publicUrl;
  }

  // Past-session gallery: keep whichever existing URLs the admin didn't
  // remove (reported back via photos_existing, same keep/drop pattern as
  // the cover image above), then append any newly uploaded files.
  let photos: string[] = [];
  try {
    const kept = JSON.parse(str(fd, "photos_existing") || "[]");
    if (Array.isArray(kept)) photos = kept.filter((u) => typeof u === "string");
  } catch {
    photos = [];
  }
  const gallerySlug = str(fd, "__slug") || slugify(titleFr);
  const newPhotoFiles = fd.getAll("gallery_photos").filter(
    (f): f is File => f instanceof File && f.size > 0,
  );
  if (photos.length + newPhotoFiles.length > MAX_GALLERY_PHOTOS) {
    return { error: `Too many gallery photos (max ${MAX_GALLERY_PHOTOS}).` };
  }
  for (const [i, f] of newPhotoFiles.entries()) {
    const fileError = validateImageFile(f);
    if (fileError) return { error: `Photo ${i + 1}: ${fileError}` };
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
    const path = `gallery/${gallerySlug}/${Date.now()}-${i}.${ext}`;
    const { error: galErr } = await sb.storage
      .from("course-images")
      .upload(path, f, { contentType: f.type, upsert: true });
    if (galErr) return { error: `Photo upload failed: ${galErr.message}` };
    photos.push(sb.storage.from("course-images").getPublicUrl(path).data.publicUrl);
  }

  // Program PDF workbook: one .xlsx per training, private bucket, read back
  // by GET /api/programs?session=<slug> (db/program_workbooks.sql).
  let program_workbook_path: string | undefined;
  const workbookFile = fd.get("program_workbook");
  if (workbookFile instanceof File && workbookFile.size > 0) {
    const path = `${str(fd, "__slug") || slugify(titleFr)}-${Date.now()}.xlsx`;
    const { error: wbErr } = await sb.storage
      .from("program-workbooks")
      .upload(path, workbookFile, {
        contentType:
          workbookFile.type ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        upsert: true,
      });
    if (wbErr) return { error: `Program workbook upload failed: ${wbErr.message}` };
    program_workbook_path = path;
  }

  // Optional bilingual { fr, en } block, only include when at least one side
  // has content, so saves keep working before db/course_qualiopi_fields.sql runs.
  const bi = (k: string): { fr: string; en: string } | undefined => {
    const fr = str(fd, `${k}_fr`);
    const en = str(fd, `${k}_en`);
    return fr || en ? { fr, en } : undefined;
  };
  let targetAudience: string[] | undefined;
  try {
    const parsed = JSON.parse(str(fd, "target_audience") || "[]");
    if (Array.isArray(parsed)) {
      targetAudience = parsed.map((t) => String(t).trim()).filter(Boolean);
    }
  } catch {
    targetAudience = undefined;
  }
  const qualiopiExtras: Record<string, unknown> = {};
  if (targetAudience && targetAudience.length) qualiopiExtras.target_audience = targetAudience;
  for (const k of [
    "prerequisites",
    "pedagogical_resources",
    "teaching_methods",
    "evaluation_methods",
    "supervision_organization",
    "accessibility_info",
    "certificate_delivered",
    "registration_info",
    "price_note",
  ]) {
    const v = bi(k);
    if (v) qualiopiExtras[k] = v;
  }
  const accessibilityReferent = str(fd, "accessibility_referent");
  if (accessibilityReferent) qualiopiExtras.accessibility_referent = accessibilityReferent;

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
    program_type: str(fd, "program_type") || "bootcamp",
    is_sponsored: fd.get("is_sponsored") != null,
    sponsors,
    summary: { fr: str(fd, "summary_fr"), en: str(fd, "summary_en") },
    objectives,
    program,
    supervisors,
    satisfaction: optNum(fd, "satisfaction"),
    pass_rate: optNum(fd, "pass_rate"),
    photos,
    status: str(fd, "status") || "open",
  };

  // Only write image_url when we actually have one, so course saves keep
  // working even before db/course_images.sql adds the column. Same guard applies
  // to the Qualiopi extras (db/course_qualiopi_fields.sql): only sent when set.
  const payload = {
    ...row,
    ...qualiopiExtras,
    ...(image_url !== null ? { image_url } : {}),
    ...(program_workbook_path ? { program_workbook_path } : {}),
  };

  if (editingSlug) {
    const { error } = await sb.from("trainings").update(payload).eq("slug", editingSlug);
    if (error) return { error: error.message };
  } else {
    const slug = `${slugify(titleFr)}-${(start || "2026-01").slice(0, 7)}`;
    const { error } = await sb.from("trainings").insert({ ...payload, slug });
    if (error) return { error: error.message };
  }

  // Save succeeded — now that nothing can roll it back, clean up whatever
  // the old row referenced that this save just replaced or dropped: the
  // previous cover image (if a new one was uploaded), removed gallery
  // photos, and the previous workbook (if a new one was uploaded).
  if (oldFiles) {
    const removedPhotos = (oldFiles.photos ?? []).filter((u) => !photos.includes(u));
    await cleanupCourseStorage(sb, {
      imageUrl: image_url !== oldFiles.image_url ? oldFiles.image_url : null,
      photos: removedPhotos,
      workbookPath:
        program_workbook_path && program_workbook_path !== oldFiles.program_workbook_path
          ? oldFiles.program_workbook_path
          : null,
    });
  }

  revalidatePath("/courses");
  redirect("/courses");
}

export async function deleteCourse(slug: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  const sb = supabaseServer();
  if (!sb) return;

  const { data: oldFiles } = await sb
    .from("trainings")
    .select("image_url, photos, program_workbook_path")
    .eq("slug", slug)
    .maybeSingle();

  await sb.from("trainings").delete().eq("slug", slug);

  if (oldFiles) {
    await cleanupCourseStorage(sb, {
      imageUrl: oldFiles.image_url,
      photos: oldFiles.photos ?? [],
      workbookPath: oldFiles.program_workbook_path,
    });
  }

  revalidatePath("/courses");
  redirect("/courses");
}
