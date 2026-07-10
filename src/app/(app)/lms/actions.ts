"use server";

import { getSessionUser } from "@/lib/auth";
import { getSkill } from "@/lib/seed/skills";

export interface LmsState {
  step?: "generated" | "published";
  module?: string;
  payload?: string;
  courseId?: string;
  error?: string;
}

/** Generate a micro-training module offline (reuses the training skill). */
export async function generateModuleAction(
  _prev: LmsState,
  formData: FormData,
): Promise<LmsState> {
  const user = await getSessionUser();
  if (!user) return { error: "Session expired, please sign in again." };

  const topic = String(formData.get("topic") || "").trim();
  const audience = String(formData.get("audience") || "All staff").trim();
  if (!topic) return { error: "Please enter a training topic." };

  const skill = getSkill("training-generator");
  const module = skill ? skill.demo({ topic, audience }) : `# ${topic}`;

  return { step: "generated", module };
}

/**
 * "Publish" to the LMS. In the demo this builds the exact payload that
 * WOULD be sent and returns a mock course id, no LMS_API call is made.
 */
export async function publishToLmsAction(
  _prev: LmsState,
  formData: FormData,
): Promise<LmsState> {
  const user = await getSessionUser();
  if (!user) return { error: "Session expired, please sign in again." };

  const topic = String(formData.get("topic") || "Untitled module").trim();
  const audience = String(formData.get("audience") || "All staff").trim();
  const module = String(formData.get("module") || "");

  const lmsConfigured = Boolean(process.env.LMS_API_URL && process.env.LMS_API_KEY);

  const payload = JSON.stringify(
    {
      endpoint: (process.env.LMS_API_URL || "https://lms.example/api/v1") + "/courses",
      method: "POST",
      auth: lmsConfigured ? "Bearer ****" : "(mock, no LMS_API_KEY set)",
      body: {
        title: topic,
        audience,
        format: "micro-training",
        source: "gepromed-ai-console",
        lessons: (module.match(/^\d+\.\s.+$/gm) || []).slice(0, 4),
        publishedBy: user.email,
      },
    },
    null,
    2,
  );

  // Deterministic mock course id (no randomness / clock dependency issues).
  const courseId =
    "GEP-" +
    Math.abs(
      [...topic].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 7),
    )
      .toString(36)
      .toUpperCase()
      .slice(0, 6);

  return { step: "published", module, payload, courseId };
}
