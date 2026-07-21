// One-off helper: mint a valid demo-admin session cookie value for local
// curl-based testing (no browser available in this sandbox).
import crypto from "node:crypto";

const secret = process.env.NEXTAUTH_SECRET || "gepromed-ai-console-demo-signing-secret-change-me";
const user = {
  email: process.env.DEFAULT_ADMIN_EMAIL || "admin@aimakers.ai",
  name: "AI Makers Admin",
  role: "admin",
  title: "Platform Administrator · AI Makers",
};
const body = { ...user, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12 };
const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
console.log(`${payload}.${sig}`);
