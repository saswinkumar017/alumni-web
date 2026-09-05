import type { LoggerLike, Tracer } from "@/lib/services";
import type { EventBus } from "@/lib/event-bus";

export interface AdminServiceContext {
  tracer: Tracer;
  usersService: {
    getUsers(signal: AbortSignal | undefined, context: Record<string, unknown>): Promise<{ success: boolean; data?: readonly unknown[] }>;
  };
  eventsService: {
    getPastEvents(params: Record<string, unknown>, context: Record<string, unknown>): Promise<{ success: boolean; data?: readonly unknown[] }>;
  };
  reportsService: {
    getReports(signal: AbortSignal | undefined, context: Record<string, unknown>): Promise<{ success: boolean; data?: readonly unknown[] }>;
  };
  alumniMgmtService: {
    getAlumni(signal: AbortSignal | undefined, context: Record<string, unknown>): Promise<{ success: boolean; data?: readonly { isVerified?: boolean }[] }>;
  };
  eventBus: EventBus;
  logger: LoggerLike;
  [key: string]: unknown;
}