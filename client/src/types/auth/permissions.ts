export type PermissionAction = "create" | "read" | "update" | "delete";

export type PermissionResource = "event" | "job" | "user" | "message" | "profile" | "report" | "announcement" | "gallery" | "audit_log" | "settings";

export type PermissionScope = "own" | "all";

export interface Permission {
  readonly action: PermissionAction;
  readonly resource: PermissionResource;
  readonly scope: PermissionScope;
}

export type RolePermissions = Record<string, readonly Permission[]>;

export function hasPermission(
  rolePermissions: RolePermissions,
  role: string,
  action: PermissionAction,
  resource: PermissionResource,
): boolean {
  const perms = rolePermissions[role];
  if (!perms) return false;
  return perms.some((p) => p.action === action && p.resource === resource);
}
