"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase";
import { ENGINEERING_PIPELINES } from "@/lib/pipeline/engineering";
import { nextStageId } from "@/lib/pipeline/core";

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
