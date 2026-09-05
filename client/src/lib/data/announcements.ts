import type { Announcement } from "@/types";
import type { Result } from "./types";
import { apiClient } from "./instance";

export async function getAnnouncements(signal?: AbortSignal): Promise<Result<readonly Announcement[]>> {
  return apiClient.get<readonly Announcement[]>("/announcements", {
    signal,
    cache: {
      tags: ["announcements:all"],
      ttlMs: 5 * 60 * 1000,
      staleWhileRevalidate: true,
    },
  });
}

export async function getFeaturedAnnouncements(signal?: AbortSignal): Promise<Result<readonly Announcement[]>> {
  return apiClient.get<readonly Announcement[]>("/announcements/featured", {
    signal,
    cache: {
      tags: ["announcements:featured"],
      ttlMs: 2 * 60 * 1000,
      staleWhileRevalidate: true,
    },
  });
}
