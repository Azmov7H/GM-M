import { NextResponse, type NextRequest } from "next/server";

import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth/session-token";

const PUBLIC_PATHS = ["/login"];
const PUBLIC_API_PREFIXES = ["/api/auth/login"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  return PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CSRF defense-in-depth (SameSite=Strict is the primary control):
  // state-changing API calls must originate from this host. Browsers always
  // send Origin on POST/PUT/DELETE fetches; requests without any origin
  // (curl, server-to-server) are allowed through.
  if (
    pathname.startsWith("/api") &&
    req.method !== "GET" &&
    req.method !== "HEAD" &&
    req.method !== "OPTIONS" &&
    !isSameOrigin(req)
  ) {
    return NextResponse.json({ error: "طلب مرفوض" }, { status: 403 });
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  const payload = token ? await verifySessionToken(token) : null;

  if (!payload) {
    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    const homeUrl = req.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const secondsLeft = payload.exp - nowSeconds;
  if (secondsLeft < SESSION_DURATION_SECONDS / 2) {
    const refreshed = await signSessionToken(payload.userId);
    const res = NextResponse.next();
    res.cookies.set(SESSION_COOKIE_NAME, refreshed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });
    return res;
  }

  return NextResponse.next();
}

function isSameOrigin(req: NextRequest): boolean {
  const host = req.nextUrl.host;
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }
  return true;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
