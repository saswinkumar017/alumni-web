import type { ServiceResult } from "@/lib/services";
import { executeWorkflow, successResult } from "@/lib/services";
import type { DashboardServiceContext } from "./dashboard-service.types";

export async function getDashboardData(
  userId: string,
  signal: AbortSignal | undefined,
  context: DashboardServiceContext,
): Promise<ServiceResult<Record<string, unknown>>> {
  return executeWorkflow<string, Record<string, unknown>>(
    userId,
    {
      async execute() {
        const [events, jobs, messages, announcements] = await Promise.all([
          context.eventsService.getEvents(signal, context),
          context.jobsService.getRecentJobs(signal, context),
          context.messagesService.getConversations(userId, signal, context),
          context.announcementsService.getFeaturedAnnouncements(signal, context),
        ]);

        return successResult({
          events: events.success ? events.data ?? [] : [],
          jobs: jobs.success ? jobs.data ?? [] : [],
          messages: messages.success ? messages.data ?? [] : [],
          announcements: announcements.success ? announcements.data ?? [] : [],
        });
      },
    },
    context,
  );
}