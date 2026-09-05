export type AuthorizationCheck = ReturnType<typeof authorize>;

import type { SessionUser } from "@/types";
import type { PermissionString } from "@/constants/security/permissions";
import { hasPermission } from "@/constants/security/permissions";
import { createServiceError, type ServiceResult, failureResult, successResult } from "@/lib/services/infra/service-error";

export type AuthorizationContext = {
  user: SessionUser | null;
};

export function authorize(
  context: AuthorizationContext,
  requiredPermission: PermissionString,
): ServiceResult<void> {
  if (!context.user) {
    return failureResult(
      createServiceError("AUTHORIZATION_ERROR", "Authentication required"),
    );
  }
  if (!hasPermission(context.user, requiredPermission)) {
    return failureResult(
      createServiceError(
        "AUTHORIZATION_ERROR",
        "You don't have permission to perform this action.",
      ),
    );
  }
  return successResult(undefined);
}

export function authorizeAny(
  context: AuthorizationContext,
  permissions: readonly PermissionString[],
): ServiceResult<void> {
  if (!context.user) {
    return failureResult(
      createServiceError("AUTHORIZATION_ERROR", "Authentication required"),
    );
  }
  if (!permissions.some((p) => hasPermission(context.user, p))) {
    return failureResult(
      createServiceError("AUTHORIZATION_ERROR", "You don't have permission to perform this action."),
    );
  }
  return successResult(undefined);
}

export function authorizeOwnership<T extends { userId?: string }>(
  context: AuthorizationContext,
  resource: T,
  resourceName = "resource",
): ServiceResult<T> {
  if (!context.user) {
    return failureResult(
      createServiceError("AUTHORIZATION_ERROR", "Authentication required"),
    );
  }
  if (context.user.role === "admin") {
    return successResult(resource);
  }
  if (resource.userId && resource.userId !== context.user.id) {
    return failureResult(
      createServiceError("AUTHORIZATION_ERROR", `You don't own this ${resourceName}.`),
    );
  }
  return successResult(resource);
}