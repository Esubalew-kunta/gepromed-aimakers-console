"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import {
  resolveAdvance,
  type Stage,
  type Parcours,
  type InterestLevel,
} from "@/lib/leads-data";

/**
 * Timestamp column set when a lead enters each stage. Covers the stages of
 * BOTH parcours (HelpMeSee + Bootcamp). Stages shared across parcours (lead,
 * confirmed, done) map to a single column. `lead` has no timestamp column.
 */
const STAGE_TS: Record<Stage, string | null> = {
  // shared
  lead: null,
  confirmed: "confirmed_at",
  done: "done_at",
  // HelpMeSee
  enrollment_form: "enrollment_form_at",
  dates_validation: "dates_validated_at",
  invoice: "invoice_paid_at",
  elearning_check: "elearning_checked_at",
  simulator_access: "simulator_access_at",
  // Bootcamp
  prerequisites: "prerequisites_ok_at",
  pre_registration: "pre_registration_at",
  deposit_contract: "deposit_contract_at",
  practical_info: "practical_info_at",
  elearning_sent: "elearning_sent_at",
  deposit_refunded: "deposit_refunded_at",
};

async function logEvent(leadId: string, type: string, payload: unknown) {
  const sb = supabaseServer();
  if (!sb) return;
  await sb.from("lead_events").insert({ lead_id: leadId, type, payload });
}

/**
 * Advance a lead to the next stage of ITS parcours, stamping the right
 * timestamp. The ordered stage list is resolved from the lead's parcours, so
 * HelpMeSee and Bootcamp leads walk their own distinct pathways.
 */
export async function advanceStage(leadId: string, current: Stage, parcours: Parcours) {
  const sb = supabaseServer();
  if (!sb) return;
  // Flags that gate the Bootcamp caution/refund branch (SOP §Bootcamp).
  const { data: row } = await sb
    .from("leads")
    .select("attended, caution_waived")
    .eq("id", leadId)
    .single();
  const next = resolveAdvance(parcours, current, {
    attended: row?.attended as boolean | null | undefined,
    cautionWaived: row?.caution_waived as boolean | null | undefined,
  });
  if (!next) return;

  const patch: Record<string, unknown> = { stage: next };
  const tsCol = STAGE_TS[next];
  if (tsCol) patch[tsCol] = new Date().toISOString();

  // Confirming a seat also fires the mock LMS handoff (both parcours).
  if (next === "confirmed") {
    patch.lms_provisioned_at = new Date().toISOString();
    patch.lms_user_id = `GLMS-${leadId.slice(0, 8).toUpperCase()}`;
  }

  await sb.from("leads").update(patch).eq("id", leadId);
  await logEvent(leadId, `stage:${next}`, { from: current, parcours });
  revalidatePath("/trainees");
}

/**
 * Mark a lead as "not interested", the exit status available at any stage of
 * either parcours. Stops reminders and stamps the exit time.
 */
export async function setNotInterested(leadId: string) {
  const sb = supabaseServer();
  if (!sb) return;
  await sb
    .from("leads")
    .update({
      interest: "not_interested",
      reminders_active: false,
      not_interested_at: new Date().toISOString(),
    })
    .eq("id", leadId);
  await logEvent(leadId, "exit:not_interested", {});
  revalidatePath("/trainees");
}

/** Set the interest badge. not_interested is a hard stop → reminders off. */
export async function setInterest(leadId: string, interest: InterestLevel) {
  const sb = supabaseServer();
  if (!sb) return;
  const patch: Record<string, unknown> = { interest };
  if (interest === "not_interested") patch.reminders_active = false;
  await sb.from("leads").update(patch).eq("id", leadId);
  await logEvent(leadId, "interest", { interest });
  revalidatePath("/trainees");
}

/** Toggle the per-lead reminders master switch. */
export async function toggleReminders(leadId: string, active: boolean) {
  const sb = supabaseServer();
  if (!sb) return;
  await sb.from("leads").update({ reminders_active: active }).eq("id", leadId);
  revalidatePath("/trainees");
}

/**
 * Late-entry exception (SOP §Bootcamp): waive the 200€ caution + contract.
 * When waived, the end-of-parcours refund step becomes "sans objet" and
 * `resolveAdvance` skips `deposit_refunded`.
 */
export async function setCautionWaived(leadId: string, waived: boolean) {
  const sb = supabaseServer();
  if (!sb) return;
  await sb.from("leads").update({ caution_waived: waived }).eq("id", leadId);
  await logEvent(leadId, "caution:waived", { waived });
  revalidatePath("/trainees");
}

/**
 * Mark whether the participant attended the full training. This gates the
 * caution refund: refunded only if attended (and not waived); otherwise the
 * caution is kept (SOP §Bootcamp).
 */
export async function setAttended(leadId: string, attended: boolean) {
  const sb = supabaseServer();
  if (!sb) return;
  await sb
    .from("leads")
    .update({
      attended,
      attendance_confirmed_at: attended ? new Date().toISOString() : null,
    })
    .eq("id", leadId);
  await logEvent(leadId, "attendance", { attended });
  revalidatePath("/trainees");
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
  revalidatePath("/trainees");
}

/** Delete a lead (demo housekeeping). */
export async function deleteLead(leadId: string) {
  const sb = supabaseServer();
  if (!sb) return;
  await sb.from("leads").delete().eq("id", leadId);
  revalidatePath("/trainees");
}

/**
 * Staff uploads the lead's signed engagement document (manual signing path).
 * Stores the file in the private `documents` bucket, records a documents row
 * (pending verification), and, for the Bootcamp parcours, moves the lead to
 * `deposit_contract` (caution / contrat reçus). HelpMeSee has no signed
 * engagement step, so the stage is left unchanged there.
 */
export async function uploadDocument(
  leadId: string,
  fd: FormData,
  parcours: Parcours = "bootcamp",
): Promise<{ error?: string }> {
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

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    sign_channel: "manual",
    contract_signed_at: now,
  };
  // Bootcamp: receiving the signed caution/contrat advances to deposit_contract.
  if (parcours === "bootcamp") {
    patch.stage = "deposit_contract";
    patch.deposit_contract_at = now;
  }
  await sb.from("leads").update(patch).eq("id", leadId);
  await logEvent(leadId, "document:uploaded", { channel: "manual", parcours });
  revalidatePath("/trainees");
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
  revalidatePath("/trainees");
}

/** Staff picks (or changes) the engagement-contract template attached to a lead. */
export async function setLeadContractTemplate(leadId: string, templateId: string) {
  const sb = supabaseServer();
  if (!sb) return;
  await sb
    .from("leads")
    .update({ contract_template_id: templateId || null })
    .eq("id", leadId);
  revalidatePath("/trainees");
}

/** Return a short-lived signed URL to view a stored document (private bucket). */
export async function getDocumentUrl(path: string): Promise<string | null> {
  const sb = supabaseServer();
  if (!sb) return null;
  const { data } = await sb.storage.from("documents").createSignedUrl(path, 120);
  return data?.signedUrl ?? null;
}
