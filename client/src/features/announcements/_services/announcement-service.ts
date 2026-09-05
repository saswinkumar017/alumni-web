import type { Announcement } from "@/types";
import type { ServiceResult } from "@/lib/services";
import { executeWorkflow, createServiceError, successResult, failureResult } from "@/lib/services";
import type { AnnouncementServiceContext } from "./announcement-service.types";

export async function getAnnouncements(
  signal: AbortSignal | undefined,
  context: AnnouncementServiceContext,
): Promise<ServiceResult<readonly Announcement[]>> {
  return executeWorkflow<void, readonly Announcement[]>(
    undefined,
    {
      async execute() {
        const result = await context.announcementsRepo.getAnnouncements(signal);
        if (!result.success) return failureResult(createServiceError("NOT_FOUND", result.error.message));
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function getFeaturedAnnouncements(
  signal: AbortSignal | undefined,
  context: AnnouncementServiceContext,
): Promise<ServiceResult<readonly Announcement[]>> {
  return executeWorkflow<void, readonly Announcement[]>(
    undefined,
    {
      async execute() {
        const result = await context.announcementsRepo.getFeaturedAnnouncements(signal);
        if (!result.success) return failureResult(createServiceError("NOT_FOUND", result.error.message));
        return successResult(result.data);
      },
    },
    context,
  );
}