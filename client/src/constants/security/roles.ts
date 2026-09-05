import type { UserRole } from "@/types";

export const ROLES = {
  DEVELOPER: "developer" as UserRole,
  ADMIN: "admin" as UserRole,
  ALUMNI_LEAD: "alumni_lead" as UserRole,
  ALUMNI: "alumni" as UserRole,
} as const;

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  developer: 4,
  admin: 3,
  alumni_lead: 2,
  alumni: 1,
};

export function roleGte(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function roleLte(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] <= ROLE_HIERARCHY[requiredRole];
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

export function isDeveloper(role: UserRole): boolean {
  return role === "developer";
}

export function isLead(role: UserRole): boolean {
  return role === "alumni_lead" || role === "admin";
}

export function isAlumni(role: UserRole): boolean {
  return role === "alumni";
}