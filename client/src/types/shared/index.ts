import type { Brand } from "@/types/utils";

export type EntityId = Brand<string, "EntityId">;

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  readonly field: string;
  readonly direction: SortDirection;
}

export interface SearchQuery {
  readonly query: string;
  readonly fields?: readonly string[];
}

export type FilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains";

export interface FilterConfig {
  readonly field: string;
  readonly operator: FilterOperator;
  readonly value: string | number | boolean;
}

export interface PaginationParams {
  readonly page: number;
  readonly pageSize: number;
}

export interface PaginatedResponse<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

export interface ApiResponse<T> {
  readonly data: T;
  readonly message?: string;
  readonly errors?: readonly string[];
}
