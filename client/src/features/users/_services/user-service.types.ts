import type { User } from "@/types";
import type { LoggerLike, Tracer } from "@/lib/services";
import type { EventBus } from "@/lib/event-bus";

export interface UserServiceContext {
  tracer: Tracer;
  usersRepo: {
    getUsers(signal?: AbortSignal): Promise<import("@/lib/data/types").Result<readonly User[]>>;
    getUser(id: string, signal?: AbortSignal): Promise<import("@/lib/data/types").Result<User>>;
  };
  eventBus: EventBus;
  logger: LoggerLike;
}