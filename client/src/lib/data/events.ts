import type { Event as AlumniEvent, EventCategory } from "@/types";
import type { Result, ListParams } from "./types";
import { apiClient } from "./instance";

export async function getEvents(params?: ListParams & { category?: EventCategory }): Promise<Result<readonly AlumniEvent[]>> {
  const [upcoming, past] = await Promise.all([getUpcomingEvents(params?.signal), getPastEvents(params)]);
  if (!upcoming.success) return upcoming;
  if (!past.success) return past;
  const merged = [...upcoming.data, ...past.data];
  const filtered = params?.category
    ? merged.filter((e) => (e as { category?: string }).category === params.category)
    : merged;
  return { success: true, data: filtered };
}

export async function getEvent(slug: string, signal?: AbortSignal): Promise<Result<AlumniEvent>> {
  return apiClient.get<AlumniEvent>(`/events/${slug}`, {
    signal,
    cache: {
      tags: [`events:${slug}`],
      ttlMs: 5 * 60 * 1000,
      staleWhileRevalidate: true,
    },
    timeout: 15000,
  });
}

export async function getUpcomingEvents(signal?: AbortSignal): Promise<Result<readonly AlumniEvent[]>> {
  return apiClient.get<readonly AlumniEvent[]>("/events/upcoming", {
    signal,
    cache: {
      tags: ["events:upcoming"],
      ttlMs: 2 * 60 * 1000,
      staleWhileRevalidate: true,
    },
  });
}

export async function getPastEvents(params?: ListParams): Promise<Result<readonly AlumniEvent[]>> {
  return apiClient.get<readonly AlumniEvent[]>("/events/past", {
    params: {
      page: params?.pagination?.page,
      limit: params?.pagination?.limit,
    },
    signal: params?.signal,
    cache: {
      tags: ["events:past"],
      ttlMs: 10 * 60 * 1000,
      staleWhileRevalidate: true,
    },
  });
}
