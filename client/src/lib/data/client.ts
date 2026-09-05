import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse, AxiosError } from "axios";
import type { ApiClientConfig, RequestConfig, Result, ResponseMetadata, NormalizedError } from "./types";
import { normalizeError, normalizeHttpError, normalizeTimeoutError, getRetryDelay } from "./errors";
import { cacheStore } from "./cache";
import { logger } from "@/lib/utils/logger";

interface ExtendedConfig extends InternalAxiosRequestConfig {
  _retryAttempt?: number;
  _maxRetries?: number;
  _startTime?: number;
  _requestId?: string;
  _cacheKey?: string;
  _cacheTags?: readonly string[];
  _cacheTTL?: number;
  _staleWhileRevalidate?: boolean;
  _timeoutMs?: number;
}

function createRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createApiClient(config: ApiClientConfig) {
  const client: AxiosInstance = axios.create({
    baseURL: config.baseUrl,
    timeout: config.defaultTimeout,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  client.interceptors.request.use(
    async (axiosConfig: InternalAxiosRequestConfig) => {
      const extended = axiosConfig as ExtendedConfig;
      const requestId = extended._requestId ?? createRequestId();
      extended._requestId = requestId;
      if (!extended._startTime) {
        extended._startTime = Date.now();
      }
      const token = await config.getToken();
      if (token) {
        extended.headers.set("Authorization", `Bearer ${token}`);
      }
      extended.headers.set("X-Request-Id", requestId);
      extended.headers.set("X-Client-Name", "alumni-web");

      if (config.applySecurityHeaders) {
        const securityHeaders = config.applySecurityHeaders(extended.method ?? "GET");
        for (const [key, value] of Object.entries(securityHeaders)) {
          extended.headers.set(key, value);
        }
      }

      if (extended._timeoutMs && extended._timeoutMs !== config.defaultTimeout) {
        extended.timeout = extended._timeoutMs;
      }

      logger.debug(`[API] ${extended.method?.toUpperCase()} ${extended.url}`, { requestId });

      return extended;
    },
    (error: unknown) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response: AxiosResponse) => {
      const extended = response.config as ExtendedConfig;
      const duration = Date.now() - (extended._startTime ?? Date.now());
      logger.debug(`[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        requestId: extended._requestId,
        duration,
      });
      if (extended._cacheKey) {
        cacheStore.set(extended._cacheKey, response.data, {
          tags: extended._cacheTags,
          ttlMs: extended._cacheTTL,
        });
      }
      return response;
    },
    async (error: unknown) => {
      const axiosError = error as AxiosError;
      const extended = (axiosError.config ?? {}) as ExtendedConfig;
      const attempt = extended._retryAttempt ?? 0;
      const maxRetries = extended._maxRetries ?? 0;
      const startTime = extended._startTime ?? Date.now();
      const duration = Date.now() - startTime;

      let normalized: NormalizedError;

      if (axiosError.code === AxiosError.ECONNABORTED) {
        normalized = normalizeTimeoutError();
      } else if (axiosError.response) {
        normalized = normalizeHttpError(axiosError.response.status, axiosError.response.data);
      } else if (axiosError.request) {
        normalized = normalizeError(new TypeError("Failed to fetch"));
      } else {
        normalized = normalizeError(axiosError);
      }

      logger.warn(`[API] Error ${normalized.type} ${extended.method?.toUpperCase()} ${extended.url}`, {
        requestId: extended._requestId,
        type: normalized.type,
        code: normalized.code,
        status: normalized.status,
        duration,
      });

      if (normalized.type === "AUTHENTICATION" && config.onAuthFailure) {
        config.onAuthFailure();
      }

      if (attempt < maxRetries && normalized.retryable) {
        const delay = getRetryDelay(normalized, attempt, {
          baseDelayMs: 1000,
          maxDelayMs: 30000,
          backoffFactor: 2,
          jitter: true,
        });
        logger.info(`[API] Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`, {
          requestId: extended._requestId,
          url: extended.url,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
        const newConfig: ExtendedConfig = { ...extended, _retryAttempt: attempt + 1 };
        return client(newConfig);
      }

      return Promise.reject(normalized);
    },
  );

  async function executeRequest<T>(
    method: string,
    url: string,
    body?: unknown,
    requestConfig?: RequestConfig,
  ): Promise<Result<T>> {
    const retryConfig = requestConfig?.retry;
    const maxRetries = retryConfig?.maxRetries ?? config.retryConfig.maxRetries;
    const cacheKey = requestConfig?.cache?.skipCache
      ? undefined
      : `${method}:${url}:${JSON.stringify(requestConfig?.params ?? {})}`;

    if (cacheKey && method === "GET") {
      const cached = cacheStore.get<T>(cacheKey);
      if (cached && !cached.isStale) {
        return { success: true, data: cached.data };
      }
    }

    try {
      const extended: ExtendedConfig = {
        method: method as InternalAxiosRequestConfig["method"],
        url,
        data: body,
        params: requestConfig?.params,
        signal: requestConfig?.signal,
        responseType: requestConfig?.responseType as InternalAxiosRequestConfig["responseType"],
        headers: new axios.AxiosHeaders(),
        _requestId: createRequestId(),
        _startTime: Date.now(),
        _retryAttempt: 0,
        _maxRetries: maxRetries,
        _cacheKey: cacheKey,
        _cacheTags: requestConfig?.cache?.tags,
        _cacheTTL: requestConfig?.cache?.ttlMs,
        _staleWhileRevalidate: requestConfig?.cache?.staleWhileRevalidate ?? true,
        _timeoutMs: requestConfig?.timeout,
      };

      if (requestConfig?.headers) {
        for (const [key, value] of Object.entries(requestConfig.headers)) {
          if (value) extended.headers.set(key, value);
        }
      }

      const response = await client(extended);

      const metadata: ResponseMetadata = {
        correlationId: extended._requestId,
        duration: Date.now() - (extended._startTime ?? Date.now()),
      };

      return { success: true, data: response.data as T, metadata };
    } catch (error: unknown) {
      if (requestConfig?.signal?.aborted) {
        return { success: false, error: normalizeError(new DOMException("Aborted", "AbortError")) };
      }
      if (error instanceof Object && "type" in error) {
        return { success: false, error: error as NormalizedError };
      }
      return { success: false, error: normalizeError(error) };
    }
  }

  return {
    get<T>(url: string, config?: RequestConfig): Promise<Result<T>> {
      return executeRequest<T>("GET", url, undefined, config);
    },
    post<T>(url: string, body?: unknown, config?: RequestConfig): Promise<Result<T>> {
      return executeRequest<T>("POST", url, body, config);
    },
    put<T>(url: string, body?: unknown, config?: RequestConfig): Promise<Result<T>> {
      return executeRequest<T>("PUT", url, body, config);
    },
    patch<T>(url: string, body?: unknown, config?: RequestConfig): Promise<Result<T>> {
      return executeRequest<T>("PATCH", url, body, config);
    },
    delete<T>(url: string, config?: RequestConfig): Promise<Result<T>> {
      return executeRequest<T>("DELETE", url, undefined, config);
    },
    getClient(): AxiosInstance {
      return client;
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
