import type { SessionUser } from "@/types";
import { createAuditEvent, logAuditEvent } from "@/lib/security/audit-service";

export function auditLoginSuccess(user: SessionUser): void {
  logAuditEvent(
    createAuditEvent("LOGIN_SUCCESS", user.id, { role: user.role }),
  );
}

export function auditLoginFailure(email: string): void {
  logAuditEvent(
    createAuditEvent("LOGIN_FAILURE", null, { attemptedEmail: email }),
  );
}

export function auditLogout(user: SessionUser): void {
  logAuditEvent(
    createAuditEvent("LOGOUT", user.id),
  );
}

export function auditPermissionDenied(userId: string, action: string): void {
  logAuditEvent(
    createAuditEvent("PERMISSION_DENIED", userId, { attemptedAction: action }),
  );
}