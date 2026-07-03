"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { recordFeedback, type FeedbackRecord } from "@/lib/store";

export interface FeedbackState {
  ok?: boolean;
  error?: string;
}

export async function submitFeedbackAction(
  _prev: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  const user = await getSessionUser();
  if (!user) return { error: "Session expired — please sign in again." };

  const message = String(formData.get("message") || "").trim();
  const page = String(formData.get("page") || "General").trim();
  const sentiment = String(
    formData.get("sentiment") || "neutral",
  ) as FeedbackRecord["sentiment"];

  if (!message) return { error: "Please enter a little feedback before sending." };

  recordFeedback({ user: user.email, page, sentiment, message });
  revalidatePath("/feedback");
  return { ok: true };
}
