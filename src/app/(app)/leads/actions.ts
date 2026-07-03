"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import {
  LEAD_STAGES,
  type LeadStage,
  type InterestLevel,
} from "@/lib/leads-data";

/** Timestamp column set when a lead enters each stage. */
const STAGE_TS: Record<LeadStage, string | null> = {
  lead: null,
  deposit_paid: "deposit_paid_at",
  contract_signed: "contract_signed_at",
  confirmed: "confirmed_at",
};

async function logEvent(leadId: string, type: string, payload: unknown) {
  const sb = supabaseServer();
  if (!sb) return;
  await sb.from("lead_events").insert({ lead_id: leadId, type, payload });
}

/** Advance a lead to the next pipeline stage, stamping the right timestamp. */
export async function advanceStage(leadId: string, current: LeadStage) {
  const sb = supabaseServer();
  if (!sb) return;
  const idx = LEAD_STAGES.indexOf(current);
  if (idx < 0 || idx >= LEAD_STAGES.length - 1) return;
  const next = LEAD_STAGES[idx + 1];

  const patch: Record<string, unknown> = { stage: next };
  const tsCol = STAGE_TS[next];
  if (tsCol) patch[tsCol] = new Date().toISOString();

  // Confirming a seat also fires the mock LMS handoff.
  if (next === "confirmed") {
    patch.lms_provisioned_at = new Date().toISOString();
    patch.lms_user_id = `GLMS-${leadId.slice(0, 8).toUpperCase()}`;
  }

  await sb.from("leads").update(patch).eq("id", leadId);
  await logEvent(leadId, `stage:${next}`, { from: current });
  revalidatePath("/leads");
}

/** Set the interest badge. not_interested is a hard stop → reminders off. */
export async function setInterest(leadId: string, interest: InterestLevel) {
  const sb = supabaseServer();
  if (!sb) return;
  const patch: Record<string, unknown> = { interest };
  if (interest === "not_interested") patch.reminders_active = false;
  await sb.from("leads").update(patch).eq("id", leadId);
  await logEvent(leadId, "interest", { interest });
  revalidatePath("/leads");
}

/** Toggle the per-lead reminders master switch. */
export async function toggleReminders(leadId: string, active: boolean) {
  const sb = supabaseServer();
  if (!sb) return;
  await sb.from("leads").update({ reminders_active: active }).eq("id", leadId);
  revalidatePath("/leads");
}

/** Add a staff comment to a lead's timeline (author = logged-in user). */
export async function addComment(leadId: string, body: string) {
  const text = body.trim();
  if (!text) return;
  const sb = supabaseServer();
  if (!sb) return;
  const user = await getSessionUser();
  await sb
    .from("lead_comments")
    .insert({ lead_id: leadId, author: user?.name ?? "Staff", body: text });
  revalidatePath("/leads");
}

/** Delete a lead (demo housekeeping). */
export async function deleteLead(leadId: string) {
  const sb = supabaseServer();
  if (!sb) return;
  await sb.from("leads").delete().eq("id", leadId);
  revalidatePath("/leads");
}

/**
 * Staff uploads the lead's signed engagement document (manual signing path).
 * Stores the file in the private `documents` bucket, records a documents row
 * (pending verification), and moves the lead to contract_signed.
 */
export async function uploadDocument(leadId: string, fd: FormData): Promise<{ error?: string }> {
  const sb = supabaseServer();
  if (!sb) return { error: "Supabase not configured." };
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };

  const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
  const path = `${leadId}/${Date.now()}.${ext}`;
  const { error: upErr } = await sb.storage
    .from("documents")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (upErr) return { error: `Upload failed: ${upErr.message}` };

  await sb.from("documents").insert({
    lead_id: leadId,
    file_url: path,
    sign_channel: "manual",
    signed: true,
    verified: false,
  });
  await sb
    .from("leads")
    .update({
      sign_channel: "manual",
      stage: "contract_signed",
      contract_signed_at: new Date().toISOString(),
    })
    .eq("id", leadId);
  await logEvent(leadId, "document:uploaded", { channel: "manual" });
  revalidatePath("/leads");
  return {};
}

/** Verify an uploaded document and confirm the seat (+ mock LMS handoff). */
export async function verifyAndConfirm(leadId: string, docId: string) {
  const sb = supabaseServer();
  if (!sb) return;
  const now = new Date().toISOString();
  await sb.from("documents").update({ verified: true, verified_at: now }).eq("id", docId);
  await sb
    .from("leads")
    .update({
      stage: "confirmed",
      confirmed_at: now,
      lms_provisioned_at: now,
      lms_user_id: `GLMS-${leadId.slice(0, 8).toUpperCase()}`,
    })
    .eq("id", leadId);
  await logEvent(leadId, "document:verified", { docId });
  revalidatePath("/leads");
}

/** Staff picks (or changes) the engagement-contract template attached to a lead. */
export async function setLeadContractTemplate(leadId: string, templateId: string) {
  const sb = supabaseServer();
  if (!sb) return;
  await sb
    .from("leads")
    .update({ contract_template_id: templateId || null })
    .eq("id", leadId);
  revalidatePath("/leads");
}

/** Return a short-lived signed URL to view a stored document (private bucket). */
export async function getDocumentUrl(path: string): Promise<string | null> {
  const sb = supabaseServer();
  if (!sb) return null;
  const { data } = await sb.storage.from("documents").createSignedUrl(path, 120);
  return data?.signedUrl ?? null;
}
