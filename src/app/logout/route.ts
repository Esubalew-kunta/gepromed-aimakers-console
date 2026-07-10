import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  // Self-hosted Node route handlers build an absolute redirect URL (via
  // req.url or req.nextUrl) from the internal bind address, not the public
  // host reverse proxies like Render put it behind, even reading
  // x-forwarded-* headers is one more thing to get wrong. A relative
  // Location header sidesteps all of that: the browser resolves it against
  // whatever origin it's actually on, server-side host detection be damned.
  return new NextResponse(null, { status: 303, headers: { Location: "/login" } });
}
