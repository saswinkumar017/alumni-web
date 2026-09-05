import type { UserSettings } from "@/types";
import type { LoggerLike, Tracer } from "@/lib/services";
import type { EventBus } from "@/lib/event-bus";

export interface SettingsServiceContext {
  tracer: Tracer;
  settingsRepo: {
    getSettings(userId: string, signal?: AbortSignal): Promise<import("@/lib/data/types").Result<UserSettings>>;
    updateSettings(userId: string, data: Partial<UserSettings>): Promise<import("@/lib/data/types").Result<UserSettings>>;
  };
  eventBus: EventBus;
  logger: LoggerLike;
}