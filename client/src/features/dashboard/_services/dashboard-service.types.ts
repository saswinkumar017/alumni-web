import type { LoggerLike, Tracer } from "@/lib/services";
import type { EventBus } from "@/lib/event-bus";

export interface DashboardServiceContext {
  tracer: Tracer;
  eventsService: {
    getEvents(signal: AbortSignal | undefined, context: Record<string, unknown>): Promise<{ success: boolean; data?: readonly unknown[] }>;
  };
  jobsService: {
    getRecentJobs(signal: AbortSignal | undefined, context: Record<string, unknown>): Promise<{ success: boolean; data?: readonly unknown[] }>;
  };
  messagesService: {
    getConversations(userId: string, signal: AbortSignal | undefined, context: Record<string, unknown>): Promise<{ success: boolean; data?: readonly unknown[] }>;
  };
  announcementsService: {
    getFeaturedAnnouncements(signal: AbortSignal | undefined, context: Record<string, unknown>): Promise<{ success: boolean; data?: readonly unknown[] }>;
  };
  eventBus: EventBus;
  logger: LoggerLike;
  [key: string]: unknown;
}