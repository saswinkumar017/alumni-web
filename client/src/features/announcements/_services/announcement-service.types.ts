import type { Announcement } from "@/types";
import type { LoggerLike, Tracer } from "@/lib/services";
import type { EventBus } from "@/lib/event-bus";

export interface AnnouncementServiceContext {
  tracer: Tracer;
  announcementsRepo: {
    getAnnouncements(signal?: AbortSignal): Promise<import("@/lib/data/types").Result<readonly Announcement[]>>;
    getFeaturedAnnouncements(signal?: AbortSignal): Promise<import("@/lib/data/types").Result<readonly Announcement[]>>;
  };
  eventBus: EventBus;
  logger: LoggerLike;
}