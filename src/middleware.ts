import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

// Paths that must stay reachable without the passcode: the gate page itself,
// its API route, and static/PWA assets the shell and browser need.
function isPublicPath(pathname: string): boolean {
  if (pathname === "/gate" || pathname === "/api/gate") return true;
  if (pathname === "/manifest.webmanifest") return true;
  if (pathname === "/sw.js") return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/icons")) return true;
  if (pathname === "/favicon.ico") return true;
  // Vercel Cron calls this with no cookie — it authenticates via the
  // CRON_SECRET bearer header inside the route handler instead.
  if (pathname.startsWith("/api/cron")) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const hasAuthCookie = request.cookies.has(AUTH_COOKIE);

  if (!hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/gate";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on everything except Next internals; isPublicPath() handles the rest.
    "/((?!_next/static|_next/image).*)",
  ],
};
