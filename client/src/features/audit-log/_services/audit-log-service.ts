import type { ServiceResult } from "@/lib/services";
import { executeWorkflow, successResult, failureResult, createServiceError } from "@/lib/services";
import type { AuditEvent } from "@/lib/security/audit-service";
import { sendAuditEvent } from "@/lib/security/audit-service";
import type { AuditLogServiceContext, AuditLogQuery } from "./audit-log-service.types";

export async function logEvent(
  event: AuditEvent,
  context: AuditLogServiceContext,
): Promise<ServiceResult<void>> {
  return executeWorkflow<AuditEvent, void>(
    event,
    {
      async execute(evt) {
        await sendAuditEvent(evt, context.sendToBackend);
        return { success: true, data: undefined };
      },
    },
    context,
  );
}

export async function queryEvents(
  query: AuditLogQuery,
  context: AuditLogServiceContext,
): Promise<ServiceResult<readonly AuditEvent[]>> {
  return executeWorkflow<AuditLogQuery, readonly AuditEvent[]>(
    query,
    {
      async execute() {
        if (!context.auditQuery) {
          return failureResult(
            createServiceError("AUTHORIZATION_ERROR", "Audit query requires admin role"),
          );
        }
        const result = await context.fetchAuditLogs?.(query);
        if (!result) {
          return failureResult(createServiceError("NOT_FOUND", "No audit logs available"));
        }
        return successResult(result);
      },
    },
    context,
  );
}