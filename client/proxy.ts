import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, isAuthRoute, requiresAdmin, requiresAuth, requiresDeveloper } from "@/lib/route-protection";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
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
    return NextResponse.redirect(loginUrl);
  }

  if (requiresDeveloper(pathname) && userRole !== "developer") {
    return NextResponse.redirect(new URL("/alumni/dashboard", request.url));
  }

  if (isAuthRoute(pathname) && sessionToken) {
    return NextResponse.redirect(new URL("/alumni/dashboard", request.url));
  }

  if (requiresAdmin(pathname) && !sessionToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
