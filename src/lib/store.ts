/**
 * In-memory demo store for skill-run history and feedback.
 *
 * Intentionally simple: state lives in the server process and RESETS on
 * restart/redeploy. This is acceptable for the demo (Option A) and keeps
 * the app free of any database requirement. To persist later, back these
 * functions with DATABASE_URL (Render PostgreSQL) — the call sites stay
 * the same.
 */

export interface RunRecord {
  id: string;
  skillId: string;
  skillName: string;
  user: string;
  when: number;
  minutesSaved: number;
}

export interface FeedbackRecord {
  id: string;
  user: string;
  page: string;
  sentiment: "positive" | "neutral" | "negative";
  message: string;
  when: number;
}

// Survive Next.js dev hot-reloads by stashing on globalThis.
const g = globalThis as unknown as {
  __gepromedStore?: { runs: RunRecord[]; feedback: FeedbackRecord[]; seq: number };
};

if (!g.__gepromedStore) {
  g.__gepromedStore = { runs: [], feedback: [], seq: 1 };
}
const store = g.__gepromedStore;

function nextId(prefix: string): string {
  // Monotonic counter + high-res tick keeps ids unique without Math.random/Date.
  const tick = (process.hrtime.bigint() % 1000000n).toString(36);
  return `${prefix}-${store.seq++}-${tick}`;
}

export function recordRun(input: {
  skillId: string;
  skillName: string;
  user: string;
  minutesSaved: number;
}): RunRecord {
  const rec: RunRecord = {
    id: nextId("run"),
    when: Date.now(),
    ...input,
  };
  store.runs.unshift(rec);
  if (store.runs.length > 50) store.runs.pop();
  return rec;
}

export function recentRuns(limit = 8): RunRecord[] {
  return store.runs.slice(0, limit);
}

export function totalRuns(): number {
  return store.runs.length;
}

export function recordFeedback(input: {
  user: string;
  page: string;
  sentiment: FeedbackRecord["sentiment"];
  message: string;
}): FeedbackRecord {
  const rec: FeedbackRecord = {
    id: nextId("fb"),
    when: Date.now(),
    ...input,
  };
  store.feedback.unshift(rec);
  if (store.feedback.length > 50) store.feedback.pop();
  return rec;
}

export function recentFeedback(limit = 20): FeedbackRecord[] {
  return store.feedback.slice(0, limit);
}
