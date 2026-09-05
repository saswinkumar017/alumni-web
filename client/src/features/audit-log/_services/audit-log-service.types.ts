import type { LoggerLike, Tracer } from "@/lib/services";
import type { AuditAction } from "@/constants/security/audit-action";
import type { AuditEvent } from "@/lib/security/audit-service";

export interface AuditLogServiceContext {
  tracer: Tracer;
  logger: LoggerLike;
  sendToBackend?: (event: AuditEvent) => Promise<void>;
  fetchAuditLogs?: (query: AuditLogQuery) => Promise<readonly AuditEvent[]>;
  auditQuery?: boolean;
}

export interface AuditLogQuery {
  action?: AuditAction;
  userId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}