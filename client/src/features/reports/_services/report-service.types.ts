import type { Report } from "@/types";
import type { LoggerLike, Tracer } from "@/lib/services";
import type { EventBus } from "@/lib/event-bus";

export interface ReportServiceContext {
  tracer: Tracer;
  reportsRepo: {
    getReports(signal?: AbortSignal): Promise<import("@/lib/data/types").Result<readonly Report[]>>;
    getReport(id: string, signal?: AbortSignal): Promise<import("@/lib/data/types").Result<Report>>;
  };
  eventBus: EventBus;
  logger: LoggerLike;
}