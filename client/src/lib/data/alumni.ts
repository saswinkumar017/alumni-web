import type { AlumniProfile } from "@/types";
import type { Result, ListParams } from "./types";
import { apiClient } from "./instance";

export function getAlumniProfileSlug(slug: string): string | null {
  const trimmed = slug.trim();
  if (!trimmed || trimmed.length > 100 || /[<>"']/.test(trimmed)) return null;
  return trimmed;
}

export async function getAlumniDirectory(params?: ListParams): Promise<Result<readonly AlumniProfile[]>> {
  return apiClient.get<readonly AlumniProfile[]>("/alumni", {
    params: params
      ? {
          page: params.pagination?.page,
          limit: params.pagination?.limit,
          search: params.search,
          sort: params.sort?.map((s) => `${s.field}:${s.direction}`),
        }
      : undefined,
    signal: params?.signal,
    cache: {
      tags: ["alumni:all"],
      ttlMs: 5 * 60 * 1000,
      staleWhileRevalidate: true,
    },
  });
}

export async function getAlumniProfile(slug: string, signal?: AbortSignal): Promise<Result<AlumniProfile>> {
  return apiClient.get<AlumniProfile>(`/alumni/${encodeURIComponent(slug)}`, {
    signal,
    cache: {
      tags: [`alumni:${slug}`],
      ttlMs: 5 * 60 * 1000,
      staleWhileRevalidate: true,
    },
    timeout: 15000,
  });
}

interface SearchHit {
  id: number | string;
  registerNumber?: string | null;
  name: string;
  department?: string | null;
  batch?: string | null;
}

function toProfile(hit: SearchHit): AlumniProfile {
  return {
    id: String(hit.id) as AlumniProfile["id"],
    slug: hit.registerNumber ?? String(hit.id),
    name: hit.name,
    batch: hit.batch ?? "",
    department: hit.department ?? "",
  };
}

export async function searchAlumni(query: string, signal?: AbortSignal): Promise<Result<readonly AlumniProfile[]>> {
  const result = await apiClient.get<{ content: SearchHit[] }>("/search", {
    params: { q: query },
    signal,
    timeout: 30000,
    cache: { skipCache: true },
  });
  if (!result.success) return result as Result<readonly AlumniProfile[]>;
  return { success: true, data: result.data.content.map(toProfile) };
}
