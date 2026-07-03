import "server-only";
/**
 * Thin Claude (Anthropic) wrapper for live skill runs.
 *
 * If ANTHROPIC_API_KEY is blank, `isClaudeConfigured()` is false and callers
 * fall back to the deterministic offline demo — the app never hard-depends on
 * a network key. Model can be overridden with ANTHROPIC_MODEL.
 */
import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

let _client: Anthropic | null = null;
function client(): Anthropic | null {
  if (!apiKey) return null;
  if (!_client) _client = new Anthropic({ apiKey });
  return _client;
}

export function isClaudeConfigured(): boolean {
  return Boolean(apiKey);
}

/** Run a single system+user prompt through Claude, return the text output. */
export async function runClaude(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const c = client();
  if (!c) throw new Error("ANTHROPIC_API_KEY not configured");
  const msg = await c.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 2000,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
