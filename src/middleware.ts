import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

/**
 * Gate the authenticated app. Middleware runs on the Edge runtime (no
 * Node crypto), so it only checks for the PRESENCE of a session cookie
 * and redirects otherwise. Full HMAC verification of the cookie happens
 * in the authenticated layout via getSessionUser() — an invalid/expired
 * cookie is rejected there and sent back to /login.
 */
const PUBLIC_PREFIXES = [
  "/login",
  "/api/health",
  "/robots.txt",
  "/favicon.ico",
  "/icon.svg",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/") url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|assets|robots.txt|favicon.ico|icon.svg).*)"],
};
