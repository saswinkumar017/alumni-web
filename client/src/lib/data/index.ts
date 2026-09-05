export { getAlumniDirectory, getAlumniProfile, searchAlumni } from "./alumni";
export { getCurrentUser, requireAuth, requireRole, setTokenProvider, setAuthFailureHandler, setTokenRefreshHandler } from "./auth";
export { getEvents, getEvent, getUpcomingEvents, getPastEvents } from "./events";
export { getAnnouncements, getFeaturedAnnouncements } from "./announcements";

export { createApiClient } from "./client";
export { createRepository } from "./repository";
export { normalizeError, normalizeHttpError, normalizeTransportError, normalizeTimeoutError, normalizeCancellationError, normalizeValidationError, normalizeOfflineError, classifyResponse, isRetryable, getRetryDelay } from "./errors";
export { CacheStore, cacheStore } from "./cache";
export { apiClient } from "./instance";
export { DEFAULT_RETRY_CONFIG, DEFAULT_TIMEOUTS } from "./types";
export type {
  Result, SuccessResult, FailureResult,
  NormalizedError, ErrorType, FieldError,
  RequestConfig, RetryConfig, TimeoutConfig,
  CacheRequestConfig, CacheEntry,
  ApiClientConfig, ResponseMetadata, RateLimitInfo,
  PaginatedRequest, PaginatedResponse,
  SortConfig, FilterConfig, PaginationParams,
  ListParams, RepositoryContext,
} from "./types";
