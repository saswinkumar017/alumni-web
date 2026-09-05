import type { SessionUser, UserRole } from "@/types";

export type ResourceDomain =
  | "profile"
  | "event"
  | "announcement"
  | "message"
  | "directory"
  | "user"
  | "settings"
  | "audit"
  | "gallery"
  | "job";

export type ActionType = "read" | "create" | "update" | "delete" | "manage";

export type PermissionScope = "self" | "public" | "any";

export type BasePermissionString = `${ResourceDomain}:${ActionType}:${PermissionScope}` | `${ResourceDomain}:${ActionType}`;

export type DevPermissionString =
  | "platform.config.read"
  | "platform.config.update"
  | "platform.config.delete"
  | "platform.branding.update"
  | "platform.navigation.update"
  | "platform.maintenance.toggle"
  | "role.read"
  | "role.create"
  | "role.update"
  | "role.delete"
  | "role.clone"
  | "role.archive"
  | "role.manage-hierarchy"
  | "permission.read"
  | "permission.create"
  | "permission.update"
  | "permission.delete"
  | "admin-override.manage"
  | "feature-flag.read"
  | "feature-flag.create"
  | "feature-flag.update"
  | "feature-flag.delete"
  | "feature-flag.toggle"
  | "page.read"
  | "page.create"
  | "page.update"
  | "page.delete"
  | "page.publish"
  | "component.read"
  | "component.manage"
  | "form.read"
  | "form.create"
  | "form.update"
  | "form.delete"
  | "form.view-submissions"
  | "notification.manage"
  | "notification.send-test"
  | "workflow.manage"
  | "theme.manage"
  | "auth.manage-providers"
  | "auth.manage-policies"
  | "auth.manage-mfa"
  | "api-key.read"
  | "api-key.create"
  | "api-key.revoke"
  | "security.manage"
  | "audit.read"
  | "audit.export"
  | "audit.search"
  | "monitoring.view"
  | "monitoring.sessions"
  | "monitoring.infrastructure"
  | "monitoring.api-metrics"
  | "monitoring.alerts"
  | "user.read"
  | "user.create"
  | "user.update"
  | "user.delete"
  | "user.impersonate"
  | "user.manage-roles"
  | "user.suspend"
  | "user.activate"
  | "user.view-sessions"
  | "user.revoke-sessions"
  | "user.reset-password"
  | "user.view-stats"
  | "announcement.create"
  | "announcement.update"
  | "announcement.delete"
  | "message.read-any"
  | "email.send-bulk"
  | "report.view"
  | "report.export"
  | "report.advanced";

export type PermissionString = BasePermissionString | DevPermissionString;

export const PERMISSIONS = {
  PROFILE_READ_SELF: "profile:read:self" as PermissionString,
  PROFILE_READ_PUBLIC: "profile:read:public" as PermissionString,
  PROFILE_READ_ANY: "profile:read:any" as PermissionString,
  PROFILE_WRITE_SELF: "profile:write:self" as PermissionString,
  EVENT_READ: "event:read" as PermissionString,
  EVENT_CREATE: "event:create" as PermissionString,
  EVENT_UPDATE: "event:update" as PermissionString,
  EVENT_DELETE: "event:delete" as PermissionString,
  EVENT_RSVP: "event:rsvp" as PermissionString,
  ANNOUNCEMENT_READ: "announcement:read" as PermissionString,
  ANNOUNCEMENT_CREATE: "announcement:create" as PermissionString,
  ANNOUNCEMENT_UPDATE: "announcement:update" as PermissionString,
  ANNOUNCEMENT_DELETE: "announcement:delete" as PermissionString,
  MESSAGE_READ: "message:read" as PermissionString,
  MESSAGE_SEND: "message:send" as PermissionString,
  DIRECTORY_READ: "directory:read" as PermissionString,
  USER_MANAGE: "user:manage" as PermissionString,
  SETTINGS_UPDATE: "settings:update" as PermissionString,
  AUDIT_READ: "audit:read" as PermissionString,
  GALLERY_UPLOAD: "gallery:upload" as PermissionString,
  GALLERY_DELETE: "gallery:delete" as PermissionString,
  JOB_CREATE: "job:create" as PermissionString,
  JOB_UPDATE: "job:update" as PermissionString,
  JOB_DELETE: "job:delete" as PermissionString,
} as const;

export type PermissionValue = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, readonly PermissionString[]> = {
  developer: [
    ...Object.values(PERMISSIONS) as PermissionString[],
    "platform.config.read",
    "platform.config.update",
    "platform.config.delete",
    "platform.branding.update",
    "platform.navigation.update",
    "platform.maintenance.toggle",
    "role.read",
    "role.create",
    "role.update",
    "role.delete",
    "role.clone",
    "role.archive",
    "role.manage-hierarchy",
    "permission.read",
    "permission.create",
    "permission.update",
    "permission.delete",
    "admin-override.manage",
    "feature-flag.read",
    "feature-flag.create",
    "feature-flag.update",
    "feature-flag.delete",
    "feature-flag.toggle",
    "page.read",
    "page.create",
    "page.update",
    "page.delete",
    "page.publish",
    "component.read",
    "component.manage",
    "form.read",
    "form.create",
    "form.update",
    "form.delete",
    "form.view-submissions",
    "notification.manage",
    "notification.send-test",
    "workflow.manage",
    "theme.manage",
    "auth.manage-providers",
    "auth.manage-policies",
    "auth.manage-mfa",
    "api-key.read",
    "api-key.create",
    "api-key.revoke",
    "security.manage",
    "audit.read",
    "audit.export",
    "audit.search",
    "monitoring.view",
    "monitoring.sessions",
    "monitoring.infrastructure",
    "monitoring.api-metrics",
    "monitoring.alerts",
    "user.read",
    "user.create",
    "user.update",
    "user.delete",
    "user.impersonate",
    "user.manage-roles",
    "user.suspend",
    "user.activate",
    "user.view-sessions",
    "user.revoke-sessions",
    "user.reset-password",
    "user.view-stats",
    "announcement.create",
    "announcement.update",
    "announcement.delete",
    "message.read-any",
    "email.send-bulk",
    "report.view",
    "report.export",
    "report.advanced",
  ],
  admin: Object.values(PERMISSIONS) as PermissionString[],
  alumni_lead: [
    PERMISSIONS.PROFILE_READ_SELF,
    PERMISSIONS.PROFILE_READ_ANY,
    PERMISSIONS.PROFILE_WRITE_SELF,
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.EVENT_CREATE,
    PERMISSIONS.EVENT_UPDATE,
    PERMISSIONS.EVENT_DELETE,
    PERMISSIONS.EVENT_RSVP,
    PERMISSIONS.ANNOUNCEMENT_READ,
    PERMISSIONS.ANNOUNCEMENT_CREATE,
    PERMISSIONS.ANNOUNCEMENT_UPDATE,
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.DIRECTORY_READ,
    PERMISSIONS.GALLERY_UPLOAD,
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.JOB_UPDATE,
  ],
  alumni: [
    PERMISSIONS.PROFILE_READ_SELF,
    PERMISSIONS.PROFILE_READ_PUBLIC,
    PERMISSIONS.PROFILE_WRITE_SELF,
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.EVENT_RSVP,
    PERMISSIONS.ANNOUNCEMENT_READ,
    PERMISSIONS.MESSAGE_READ,
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.DIRECTORY_READ,
  ],
};

export function hasPermission(user: SessionUser | null, permission: PermissionString): boolean {
  if (!user) return false;
  const rolePermissions = ROLE_PERMISSIONS[user.role];
  return rolePermissions.includes(permission);
}

export function hasAnyPermission(user: SessionUser | null, permissions: readonly PermissionString[]): boolean {
  if (!user) return false;
  return permissions.some((p) => hasPermission(user, p));
}

export function hasAllPermissions(user: SessionUser | null, permissions: readonly PermissionString[]): boolean {
  if (!user) return false;
  return permissions.every((p) => hasPermission(user, p));
}