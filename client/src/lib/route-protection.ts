import type { SessionUser } from "@/types/domain/session";

export type RouteSegmentLabelResolver = (segment: string) => Promise<string>;

export type RouteClassification =
  | "STATIC_PUBLIC"
  | "DYNAMIC_PUBLIC"
  | "STATIC_LEGAL"
  | "TRANSIENT_AUTH"
  | "PROTECTED_ALUMNI"
  | "PROTECTED_ADMIN"
  | "PROTECTED_DEVELOPER";

export type RenderStrategy = "SSG" | "ISR" | "SSR";

export interface RouteConfig {
  classification: RouteClassification;
  renderStrategy: RenderStrategy;
  revalidate?: number;
  noindex: boolean;
}

export function getRouteClassification(pathname: string): RouteClassification {
  if (pathname.startsWith("/developer")) return "PROTECTED_DEVELOPER";
  if (pathname.startsWith("/admin")) return "PROTECTED_ADMIN";
  if (pathname.startsWith("/alumni")) return "PROTECTED_ALUMNI";
  if (pathname.startsWith("/auth")) return "TRANSIENT_AUTH";
  if (pathname.startsWith("/legal")) return "STATIC_LEGAL";
  return "DYNAMIC_PUBLIC";
}

export function getRenderStrategy(classification: RouteClassification): RenderStrategy {
  switch (classification) {
    case "STATIC_PUBLIC":
    case "STATIC_LEGAL":
      return "SSG";
    case "DYNAMIC_PUBLIC":
    case "PROTECTED_ALUMNI":
      return "ISR";
    case "TRANSIENT_AUTH":
    case "PROTECTED_ADMIN":
    case "PROTECTED_DEVELOPER":
      return "SSR";
  }
}

export function requiresAuth(pathname: string): boolean {
  const classification = getRouteClassification(pathname);
  return (
    classification === "PROTECTED_ALUMNI" ||
    classification === "PROTECTED_ADMIN" ||
    classification === "PROTECTED_DEVELOPER"
  );
}

export function requiresDeveloper(pathname: string): boolean {
  return getRouteClassification(pathname) === "PROTECTED_DEVELOPER";
}

export function requiresAdmin(pathname: string): boolean {
  return getRouteClassification(pathname) === "PROTECTED_ADMIN";
}

export function isAuthRoute(pathname: string): boolean {
  return getRouteClassification(pathname) === "TRANSIENT_AUTH";
}

export function hasAccess(user: SessionUser | null, pathname: string): boolean {
  if (!requiresAuth(pathname)) return true;
  if (!user) return false;
  if (requiresDeveloper(pathname)) return user.role === "developer";
  if (requiresAdmin(pathname)) return user.role === "admin";
  return user.role === "alumni" || user.role === "admin" || user.role === "alumni_lead";
}

export const AUTH_COOKIE_NAME = "session_token";
