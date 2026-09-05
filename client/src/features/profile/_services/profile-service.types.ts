import type { AlumniProfile, Education, Employment } from "@/types";
import type { LoggerLike, Tracer } from "@/lib/services";
import type { EventBus } from "@/lib/event-bus";

export interface ProfileServiceContext {
  tracer: Tracer;
  profileRepo: {
    getProfile(userId: string, signal?: AbortSignal): Promise<import("@/lib/data/types").Result<AlumniProfile>>;
    updateProfile(userId: string, data: Partial<AlumniProfile>): Promise<import("@/lib/data/types").Result<AlumniProfile>>;
    updateEducation(userId: string, education: readonly Education[]): Promise<import("@/lib/data/types").Result<readonly Education[]>>;
    updateEmployment(userId: string, employment: readonly Employment[]): Promise<import("@/lib/data/types").Result<readonly Employment[]>>;
  };
  eventBus: EventBus;
  logger: LoggerLike;
}