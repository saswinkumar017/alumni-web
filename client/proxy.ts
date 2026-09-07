import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, isAuthRoute, requiresAdmin, requiresAuth, requiresDeveloper } from "@/lib/route-protection";

function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) return true;
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    );
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

function clearSession(response: NextResponse) {
  response.cookies.delete(AUTH_COOKIE_NAME);
  response.cookies.delete("user_role");
  return response;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawToken = request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
  const sessionToken = rawToken && !isJwtExpired(rawToken) ? rawToken : null;
  const userRole = request.cookies.get("user_role")?.value ?? null;

  const response = NextResponse.next();

  response.headers.set(
    "X-Robots-Tag",
    pathname.startsWith("/alumni") || pathname.startsWith("/admin") || pathname.startsWith("/auth")
      ? "noindex"
      : "all",
  );

  if (requiresAuth(pathname) && !sessionToken) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const redirect = NextResponse.redirect(loginUrl);
    if (rawToken) return clearSession(redirect);
    return redirect;
  }

  if (requiresDeveloper(pathname) && userRole !== "developer") {
    return NextResponse.redirect(new URL("/alumni/dashboard", request.url));
  }

  if (isAuthRoute(pathname) && sessionToken) {
    return NextResponse.redirect(new URL("/alumni/dashboard", request.url));
  }

  if (requiresAdmin(pathname) && !sessionToken) {
    const redirect = NextResponse.redirect(new URL("/auth/login", request.url));
    if (rawToken) return clearSession(redirect);
    return redirect;
  }

  // Expired token on a public page: clean up so a restart never looks logged-in
  if (rawToken && !sessionToken) {
    return clearSession(response);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
