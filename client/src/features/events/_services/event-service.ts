import type { Event as AlumniEvent } from "@/types";
import type { ServiceResult } from "@/lib/services";
import { executeWorkflow, createServiceError, successResult, failureResult } from "@/lib/services";
import type { EventServiceContext, EventListInput } from "./event-service.types";

export async function getEvents(
  input: EventListInput,
  context: EventServiceContext,
): Promise<ServiceResult<readonly AlumniEvent[]>> {
  return executeWorkflow<EventListInput, readonly AlumniEvent[]>(
    input,
    {
      async execute(params) {
        const result = await context.eventsRepo.getEvents(params);
        if (!result.success) {
          return failureResult(createServiceError("NOT_FOUND", result.error.message));
        }
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function getEvent(
  slug: string,
  signal: AbortSignal | undefined,
  context: EventServiceContext,
): Promise<ServiceResult<AlumniEvent>> {
  return executeWorkflow<string, AlumniEvent>(
    slug,
    {
      async execute(id) {
        const result = await context.eventsRepo.getEvent(id, signal);
        if (!result.success) {
          return failureResult(createServiceError("NOT_FOUND", result.error.message));
        }
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function getUpcomingEvents(
  signal: AbortSignal | undefined,
  context: EventServiceContext,
): Promise<ServiceResult<readonly AlumniEvent[]>> {
  return executeWorkflow<void, readonly AlumniEvent[]>(
    undefined,
    {
      async execute() {
        const result = await context.eventsRepo.getUpcomingEvents(signal);
        if (!result.success) {
          return failureResult(createServiceError("NOT_FOUND", result.error.message));
        }
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function getPastEvents(
  input: EventListInput,
  context: EventServiceContext,
): Promise<ServiceResult<readonly AlumniEvent[]>> {
  return executeWorkflow<EventListInput, readonly AlumniEvent[]>(
    input,
    {
      async execute(params) {
        const result = await context.eventsRepo.getPastEvents(params);
        if (!result.success) {
          return failureResult(createServiceError("NOT_FOUND", result.error.message));
        }
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function createEvent(
  data: Omit<AlumniEvent, "id" | "createdAt" | "updatedAt">,
  context: EventServiceContext,
): Promise<ServiceResult<AlumniEvent>> {
  return executeWorkflow<Omit<AlumniEvent, "id" | "createdAt" | "updatedAt">, AlumniEvent>(
    data,
    {
      async execute(input) {
        const result = await context.eventsRepo.createEvent(input);
        if (!result.success) {
          return failureResult(createServiceError("VALIDATION_ERROR", result.error.message));
        }
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function updateEvent(
  id: string,
  data: Partial<AlumniEvent>,
  context: EventServiceContext,
): Promise<ServiceResult<AlumniEvent>> {
  return executeWorkflow<{ id: string; data: Partial<AlumniEvent> }, AlumniEvent>(
    { id, data },
    {
      async execute(input) {
        const result = await context.eventsRepo.updateEvent(input.id, input.data);
        if (!result.success) {
          return failureResult(createServiceError("NOT_FOUND", result.error.message));
        }
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function deleteEvent(
  id: string,
  context: EventServiceContext,
): Promise<ServiceResult<void>> {
  return executeWorkflow<string, void>(
    id,
    {
      async execute(input) {
        const result = await context.eventsRepo.deleteEvent(input);
        if (!result.success) {
          return failureResult(createServiceError("NOT_FOUND", result.error.message));
        }
        return successResult(undefined);
      },
    },
    context,
  );
}

export async function rsvpToEvent(
  eventId: string,
  userId: string,
  status: "going" | "maybe" | "not-going",
  context: EventServiceContext,
): Promise<ServiceResult<void>> {
  return executeWorkflow<{ eventId: string; userId: string; status: string }, void>(
    { eventId, userId, status },
    {
      async execute(input) {
        const result = await context.eventsRepo.rsvp(input.eventId, input.userId, input.status);
        if (!result.success) {
          return failureResult(createServiceError("CONFLICT", result.error.message));
        }
        return successResult(undefined);
      },
    },
    context,
  );
}

export async function generateCalendarUrl(
  event: AlumniEvent,
  _context: EventServiceContext,
): Promise<string> {
  const start = new Date(event.date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const end = start;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description || "",
    location: event.location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}