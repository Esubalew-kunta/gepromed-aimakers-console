import crypto from "crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";

/**
 * Lightweight, dependency-free session auth for the demo.
 *
 * A session is an HMAC-signed cookie. No database, no NextAuth runtime,
 * no network calls — so the app deploys and logs in reliably on Render
 * even when every optional environment variable is blank.
 */

export { SESSION_COOKIE };
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export type DemoRole = "admin" | "gepromed" | "manager";

export interface DemoUser {
  email: string;
  password: string;
  name: string;
  role: DemoRole;
  title: string;
}

export interface SessionUser {
  email: string;
  name: string;
  role: DemoRole;
  title: string;
}

/**
 * The signing secret. Falls back to a stable built-in value so signing
 * never crashes on a bare deploy. Set NEXTAUTH_SECRET in Render for a
 * hardened demo.
 */
function secret(): string {
  return (
    process.env.NEXTAUTH_SECRET ||
    "gepromed-ai-console-demo-signing-secret-change-me"
  );
}

/**
 * Demo login accounts. Emails/passwords come from env vars with safe
 * documented fallbacks so login always works out of the box.
 */
export function demoUsers(): DemoUser[] {
  return [
    {
      email: process.env.DEFAULT_ADMIN_EMAIL || "admin@aimakers.ai",
      password: process.env.DEFAULT_ADMIN_PASSWORD || "aimakers-demo",
      name: "AI Makers Admin",
      role: "admin",
      title: "Platform Administrator · AI Makers",
    },
    {
      email: process.env.DEMO_GEPROMED_EMAIL || "demo@gepromed.com",
      password: process.env.DEMO_GEPROMED_PASSWORD || "gepromed-demo",
      name: "Camille Roussel",
      role: "gepromed",
      title: "Clinical Operations Specialist · Gepromed",
    },
    {
      email: process.env.DEMO_MANAGER_EMAIL || "manager@gepromed.com",
      password: process.env.DEMO_MANAGER_PASSWORD || "gepromed-manager",
      name: "Étienne Marchand",
      role: "manager",
      title: "Head of Quality & Regulatory · Gepromed",
    },
  ];
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(user: SessionUser): string {
  const body = {
    email: user.email,
    name: user.name,
    role: user.role,
    title: user.title,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  // Constant-time comparison (Uint8Array views to satisfy TS lib types).
  const a = new Uint8Array(Buffer.from(signature));
  const b = new Uint8Array(Buffer.from(expected));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const body = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof body.exp === "number" && body.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return {
      email: body.email,
      name: body.name,
      role: body.role,
      title: body.title,
    };
  } catch {
    return null;
  }
}

/** Validate credentials against the demo accounts. */
export function authenticate(email: string, password: string): SessionUser | null {
  const normalized = email.trim().toLowerCase();
  const user = demoUsers().find(
    (u) => u.email.toLowerCase() === normalized && u.password === password,
  );
  if (!user) return null;
  return { email: user.email, name: user.name, role: user.role, title: user.title };
}

/** Read the current session from cookies (server components / actions). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
