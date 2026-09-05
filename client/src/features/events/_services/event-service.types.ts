import type { Event as AlumniEvent } from "@/types";
import type { LoggerLike, Tracer } from "@/lib/services";
import type { EventBus } from "@/lib/event-bus";
import type { ListParams } from "@/lib/data/types";

export interface EventServiceContext {
  tracer: Tracer;
  eventsRepo: {
    getEvents(params?: ListParams & { category?: string }): Promise<import("@/lib/data/types").Result<readonly AlumniEvent[]>>;
    getEvent(slug: string, signal?: AbortSignal): Promise<import("@/lib/data/types").Result<AlumniEvent>>;
    getUpcomingEvents(signal?: AbortSignal): Promise<import("@/lib/data/types").Result<readonly AlumniEvent[]>>;
    getPastEvents(params?: ListParams): Promise<import("@/lib/data/types").Result<readonly AlumniEvent[]>>;
    createEvent(data: Omit<AlumniEvent, "id" | "createdAt" | "updatedAt">): Promise<import("@/lib/data/types").Result<AlumniEvent>>;
    updateEvent(id: string, data: Partial<AlumniEvent>): Promise<import("@/lib/data/types").Result<AlumniEvent>>;
    deleteEvent(id: string): Promise<import("@/lib/data/types").Result<void>>;
    rsvp(eventId: string, userId: string, status: string): Promise<import("@/lib/data/types").Result<void>>;
  };
  eventBus: EventBus;
  logger: LoggerLike;
}

export interface EventListInput extends ListParams {
  category?: string;
}