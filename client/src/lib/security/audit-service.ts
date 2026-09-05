import type { AuditAction } from "@/constants/security/audit-action";
import { logger } from "@/lib/utils/logger";

function generateCorrelationId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface AuditEvent {
  action: AuditAction;
  userId: string | null;
  correlationId: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  severity?: "INFO" | "WARN" | "ERROR" | "CRITICAL";
  resourceId?: string;
}

export function createAuditEvent(
  action: AuditAction,
  userId: string | null,
  metadata?: Record<string, unknown>,
): AuditEvent {
  return {
    action,
    userId,
    correlationId: generateCorrelationId(),
    metadata,
    timestamp: new Date().toISOString(),
  };
}

export function logAuditEvent(event: AuditEvent): void {
  logger.info(`[AUDIT] ${event.action}`, {
    userId: event.userId,
    correlationId: event.correlationId,
    metadata: event.metadata,
    timestamp: event.timestamp,
  });
}

export async function sendAuditEvent(
  event: AuditEvent,
  sendToBackend?: (event: AuditEvent) => Promise<void>,
): Promise<void> {
  logAuditEvent(event);
  if (sendToBackend) {
    try {
      await sendToBackend(event);
    } catch {
      logger.warn("[AUDIT] Failed to send audit event to backend", {
        action: event.action,
        correlationId: event.correlationId,
      });
    }
  }
}