import type { SortConfig, FilterConfig, PaginationParams, PaginatedResponse } from "@/types/shared";

export type ErrorType =
  | "TRANSPORT"
  | "TIMEOUT"
  | "AUTHENTICATION"
  | "AUTHORIZATION"
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMIT"
  | "SERVER"
  | "OFFLINE"
  | "CANCELLATION"
  | "UNEXPECTED";

export interface FieldError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

export interface NormalizedError {
  readonly type: ErrorType;
  readonly code: string;
  readonly message: string;
  readonly status: number | null;
  readonly details: readonly FieldError[] | null;
  readonly retryable: boolean;
  readonly correlationId: string;
  readonly timestamp: string;
}

export type SuccessResult<T> = {
  readonly success: true;
  readonly data: T;
  readonly metadata?: ResponseMetadata;
};

export type FailureResult = {
  readonly success: false;
  readonly error: NormalizedError;
};

export type Result<T> = SuccessResult<T> | FailureResult;

export interface ResponseMetadata {
  readonly correlationId?: string;
  readonly duration?: number;
  readonly rateLimit?: RateLimitInfo;
}

export interface RateLimitInfo {
  readonly limit: number;
  readonly remaining: number;
  readonly reset: number;
}

export interface RequestConfig {
  readonly headers?: Record<string, string>;
  readonly params?: Record<string, string | number | boolean | readonly string[] | undefined>;
  readonly signal?: AbortSignal;
  readonly timeout?: number;
  readonly retry?: RetryConfig;
  readonly cache?: CacheRequestConfig;
  readonly responseType?: "json" | "blob" | "text" | "arraybuffer" | "stream" | "formdata";
}

export interface RetryConfig {
  readonly maxRetries: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoffFactor: number;
  readonly jitter: boolean;
  readonly retryableErrors?: readonly ErrorType[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffFactor: 2,
  jitter: true,
};

export interface TimeoutConfig {
  readonly list: number;
  readonly detail: number;
  readonly create: number;
  readonly update: number;
  readonly delete: number;
  readonly upload: number;
  readonly download: number;
  readonly search: number;
}

export const DEFAULT_TIMEOUTS: TimeoutConfig = {
  list: 30000,
  detail: 15000,
  create: 10000,
  update: 10000,
  delete: 10000,
  upload: 120000,
  download: 300000,
  search: 30000,
};

export interface CacheRequestConfig {
  readonly tags?: readonly string[];
  readonly ttlMs?: number;
  readonly staleWhileRevalidate?: boolean;
  readonly skipCache?: boolean;
}

export interface CacheEntry<T> {
  readonly data: T;
  readonly tags: readonly string[];
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly staleAt: number;
}

export interface ApiClientConfig {
  readonly baseUrl: string;
  readonly defaultTimeout: number;
  readonly retryConfig: RetryConfig;
  readonly getToken: () => Promise<string | null>;
  readonly onAuthFailure?: () => void;
  readonly onTokenRefresh?: () => Promise<string | null>;
  readonly applySecurityHeaders?: (method: string) => Record<string, string>;
}

export interface RequestInterceptor {
  (config: RequestConfig & { url: string; method: string }): Promise<RequestConfig & { url: string; method: string }>;
}

export interface ResponseInterceptor {
  (response: unknown): unknown;
}

export type PaginatedRequest = Readonly<{
  page?: number;
  limit?: number;
  cursor?: string;
  sort?: readonly SortConfig[];
  filters?: readonly FilterConfig[];
  search?: string;
  searchFields?: readonly string[];
}>;

export type { SortConfig, FilterConfig, PaginationParams, PaginatedResponse };

export interface ListParams {
  readonly pagination?: PaginatedRequest;
  readonly sort?: readonly SortConfig[];
  readonly filters?: readonly FilterConfig[];
  readonly search?: string;
  readonly signal?: AbortSignal;
}

export interface RepositoryClient {
  get<T>(url: string, config?: RequestConfig): Promise<Result<T>>;
  post<T>(url: string, body?: unknown, config?: RequestConfig): Promise<Result<T>>;
  put<T>(url: string, body?: unknown, config?: RequestConfig): Promise<Result<T>>;
  patch<T>(url: string, body?: unknown, config?: RequestConfig): Promise<Result<T>>;
  delete<T>(url: string, config?: RequestConfig): Promise<Result<T>>;
}

export interface RepositoryContext {
  readonly client: RepositoryClient;
  readonly basePath: string;
}
