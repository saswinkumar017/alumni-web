import type { AlumniProfile } from "@/types";
import type { LoggerLike, Tracer } from "@/lib/services";
import type { EventBus } from "@/lib/event-bus";
import type { ListParams } from "@/lib/data/types";
export interface DirectoryServiceContext {
  tracer: Tracer;
  directoryRepo: {
    getAlumniDirectory(params?: ListParams): Promise<import("@/lib/data/types").Result<readonly AlumniProfile[]>>;
    getAlumniProfile(slug: string, signal?: AbortSignal): Promise<import("@/lib/data/types").Result<AlumniProfile>>;
    searchAlumni(query: string, signal?: AbortSignal): Promise<import("@/lib/data/types").Result<readonly AlumniProfile[]>>;
    updateProfile(userId: string, data: Partial<AlumniProfile>): Promise<import("@/lib/data/types").Result<AlumniProfile>>;
  };
  eventBus: EventBus;
  logger: LoggerLike;
}

export type DirectoryListInput = import("@/lib/data/types").ListParams;