export {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from "./permissions";
export type {
  ResourceDomain,
  ActionType,
  PermissionScope,
  PermissionString,
  PermissionValue,
} from "./permissions";

export {
  ROLES,
  ROLE_HIERARCHY,
  roleGte,
  roleLte,
  isAdmin,
  isLead,
  isAlumni,
} from "./roles";

export {
  maskEmail,
  maskPhone,
  maskName,
  isPiiField,
} from "./masking";

export {
  AuditActions,
} from "./audit-action";
export type { AuditAction } from "./audit-action";