/**
 * Shared validation for every "upload a document" path (contract templates,
 * staff manual uploads on a trainee's behalf). Previously each server action
 * only checked `file.size === 0`; any file type and any size — a 2GB video,
 * an .exe — was silently accepted and stored in Supabase Storage. The
 * `accept` attribute on the <input type="file"> is a UI hint only and does
 * nothing to stop a non-browser POST or a renamed file, so this must be
 * enforced server-side, not just in the form.
 */

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateDocumentFile(file: File): string | null {
  if (file.size === 0) return "The selected file is empty.";
  if (file.size > MAX_DOCUMENT_BYTES) {
    return `File is too large (max ${MAX_DOCUMENT_BYTES / (1024 * 1024)} MB).`;
  }
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type as (typeof ALLOWED_DOCUMENT_TYPES)[number])) {
    return "Unsupported file type. Please upload a PDF, JPEG, PNG or WEBP file.";
  }
  return null;
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Same rules as validateDocumentFile but image-only (cover image, gallery
 * photos) — a PDF is a valid document but never a valid photo. */
export function validateImageFile(file: File): string | null {
  if (file.size === 0) return "The selected file is empty.";
  if (file.size > MAX_DOCUMENT_BYTES) {
    return `File is too large (max ${MAX_DOCUMENT_BYTES / (1024 * 1024)} MB).`;
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Unsupported file type. Please upload a JPEG, PNG or WEBP image.";
  }
  return null;
}
