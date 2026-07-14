"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";
import { ENGINEERING_PIPELINES } from "@/lib/pipeline/engineering";
import { nextStageId } from "@/lib/pipeline/core";

export interface EngComment {
  id: string;
  author: string | null;
  body: string;
  created_at: string;
}

/** Advance a request to the next stage of its pipeline (kind + variant aware). */
export async function advanceEngStage(
  id: string,
  kind: string,
  variant: string | null,
  current: string,
) {
  const sb = supabaseServer();
  if (!sb) return;
  const def = ENGINEERING_PIPELINES[kind];
  if (!def) return;
  const next = nextStageId(def, variant ?? def.defaultVariantKey, current);
  if (!next) return;
  await sb.from("engineering_requests").update({ stage: next }).eq("id", id);
  revalidatePath("/engineering");
}

/** Set the explant case (hospital | industrial). */
export async function setEngVariant(id: string, variant: string) {
  const sb = supabaseServer();
  if (!sb) return;
  await sb.from("engineering_requests").update({ variant }).eq("id", id);
  revalidatePath("/engineering");
}

/** Exit the pipeline (sans suite / décliné). Stops reminders. */
export async function setEngExit(id: string, reason: string) {
  const sb = supabaseServer();
  if (!sb) return;
  await sb
    .from("engineering_requests")
    .update({
      exit_reason: reason || "sans suite",
      exited_at: new Date().toISOString(),
      reminders_active: false,
    })
    .eq("id", id);
  revalidatePath("/engineering");
}

/** Reopen an exited request. */
export async function reopenEng(id: string) {
  const sb = supabaseServer();
  if (!sb) return;
  await sb
    .from("engineering_requests")
    .update({ exit_reason: null, exited_at: null, reminders_active: true })
    .eq("id", id);
  revalidatePath("/engineering");
}

/** Comments for a request, oldest first. Returns [] until the table exists. */
export async function getEngComments(id: string): Promise<EngComment[]> {
  const sb = supabaseServer();
  if (!sb) return [];
  const { data, error } = await sb
    .from("engineering_comments")
    .select("id, author, body, created_at")
    .eq("engineering_request_id", id)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as EngComment[];
}

/**
 * Send a stage email to the requester via the n8n webhook (the real "Send"
 * button). Mirrors the expense-mirror pattern: env-gated by `ENG_EMAIL_WEBHOOK_URL`,
 * authed with `N8N_WEBHOOK_SECRET`, never throws. Sends the staff-EDITED subject/
 * body so it's review-then-send, not blind auto-fire. Records a best-effort audit
 * comment on success. Returns a small status the drawer surfaces.
 */
export async function sendEngEmail(input: {
  requestId: string;
  ref: string | null;
  to: string;
  subject: string;
  body: string;
}): Promise<{ ok: boolean; reason?: "not_configured" | "unreachable" | string }> {
  const url = process.env.ENG_EMAIL_WEBHOOK_URL;
  if (!url) return { ok: false, reason: "not_configured" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET ?? "",
      },
      body: JSON.stringify({
        requestId: input.requestId,
        ref: input.ref,
        to: input.to,
        subject: input.subject,
        body: input.body,
      }),
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    // Best-effort audit trail (degrades silently if the comments table is absent).
    const user = await getSessionUser();
    const sb = supabaseServer();
    if (sb) {
      await sb
        .from("engineering_comments")
        .insert({
          engineering_request_id: input.requestId,
          author: user?.name ?? "Staff",
          body: `📧 Email sent to ${input.to} — ${input.subject}`,
        });
    }
    revalidatePath("/engineering");
    return { ok: true };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}

/** Add a staff comment to a request (author = logged-in user). */
export async function addEngComment(id: string, body: string) {
  const text = body.trim();
  if (!text) return;
  const sb = supabaseServer();
  if (!sb) return;
  const user = await getSessionUser();
  await sb
    .from("engineering_comments")
    .insert({ engineering_request_id: id, author: user?.name ?? "Staff", body: text });
  revalidatePath("/engineering");
}
