import type { AlumniProfile } from "@/types";
import type { LoggerLike, Tracer } from "@/lib/services";
import type { EventBus } from "@/lib/event-bus";

export interface AlumniMgmtServiceContext {
  tracer: Tracer;
  alumniMgmtRepo: {
    getAlumni(signal?: AbortSignal): Promise<import("@/lib/data/types").Result<readonly AlumniProfile[]>>;
    getAlumnus(id: string, signal?: AbortSignal): Promise<import("@/lib/data/types").Result<AlumniProfile>>;
    approveAlumnus(id: string): Promise<import("@/lib/data/types").Result<AlumniProfile>>;
    rejectAlumnus(id: string, reason: string): Promise<import("@/lib/data/types").Result<void>>;
  };
  eventBus: EventBus;
  logger: LoggerLike;
}