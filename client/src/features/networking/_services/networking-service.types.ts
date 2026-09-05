import type { AlumniProfile } from "@/types";
import type { LoggerLike, Tracer } from "@/lib/services";
import type { EventBus } from "@/lib/event-bus";

export interface NetworkingServiceContext {
  tracer: Tracer;
  networkingRepo: {
    getProfiles(signal?: AbortSignal): Promise<import("@/lib/data/types").Result<readonly AlumniProfile[]>>;
    getProfile(slug: string, signal?: AbortSignal): Promise<import("@/lib/data/types").Result<AlumniProfile>>;
    sendConnectionRequest(targetUserId: string): Promise<import("@/lib/data/types").Result<void>>;
  };
  eventBus: EventBus;
  logger: LoggerLike;
}