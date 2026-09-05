import type { ServiceResult } from "./service-error";
import { successResult } from "./service-error";

export interface SearchOptions {
  query: string;
  fields?: readonly string[];
  limit?: number;
  offset?: number;
  fuzzy?: boolean;
}

export interface SearchResult<T> {
  items: readonly T[];
  total: number;
  hasMore: boolean;
  query: string;
}

export function buildSearchRegex(query: string): RegExp {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped, "i");
}

export function filterByQuery<T>(
  items: readonly T[],
  query: string,
  fieldSelector: (item: T) => string,
): T[] {
  if (!query.trim()) return [...items];
  const regex = buildSearchRegex(query);
  return items.filter((item) => regex.test(fieldSelector(item)));
}

export function paginateResults<T>(
  items: readonly T[],
  limit: number,
  offset: number,
): { items: readonly T[]; total: number; hasMore: boolean } {
  const total = items.length;
  const sliced = items.slice(offset, offset + limit);
  return {
    items: sliced,
    total,
    hasMore: offset + limit < total,
  };
}

export async function searchEntities<T>(
  fetcher: () => Promise<ServiceResult<readonly T[]>>,
  query: string,
  fieldSelector: (item: T) => string,
  limit = 20,
  offset = 0,
): Promise<ServiceResult<SearchResult<T>>> {
  const result = await fetcher();
  if (!result.success) return result;
  const filtered = filterByQuery(result.data, query, fieldSelector);
  const { items, total, hasMore } = paginateResults(filtered, limit, offset);
  return successResult({ items, total, hasMore, query });
}