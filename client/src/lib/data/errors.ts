import type { ErrorType, NormalizedError, FieldError } from "./types";
import { getErrorMessage } from "@/lib/utils/error";

function generateCorrelationId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createNormalizedError(params: {
  type: ErrorType;
  code?: string;
  message?: string;
  status?: number | null;
  details?: readonly FieldError[] | null;
  retryable?: boolean;
}): NormalizedError {
  return {
    type: params.type,
    code: params.code ?? "UNKNOWN_ERROR",
    message: params.message ?? "An unexpected error occurred",
    status: params.status ?? null,
    details: params.details ?? null,
    retryable: params.retryable ?? false,
    correlationId: generateCorrelationId(),
    timestamp: new Date().toISOString(),
  };
}

export function normalizeHttpError(status: number, data: unknown): NormalizedError {
  const body = data as Record<string, unknown> | null;
  const rawMessage = body?.message ?? body?.error ?? "";
  const message = typeof rawMessage === "string" ? rawMessage : "An error occurred";
  const code = typeof body?.code === "string" ? body.code : `HTTP_${status}`;

  let details: readonly FieldError[] | null = null;
  if (body?.details && Array.isArray(body.details)) {
    details = body.details.map((d: unknown) => {
      const item = d as Record<string, unknown>;
      return {
        field: typeof item.field === "string" ? item.field : "",
        message: typeof item.message === "string" ? item.message : "",
        code: typeof item.code === "string" ? item.code : "INVALID_FIELD",
      };
    });
  }

  if (status === 400 || status === 422) {
    if (!details && body?.errors && Array.isArray(body.errors)) {
      details = body.errors.map((e: unknown) => {
        const item = e as Record<string, unknown>;
        return {
          field: typeof item.field === "string" ? item.field : "",
          message: typeof item.message === "string" ? item.message : getErrorMessage(item),
          code: "VALIDATION_ERROR",
        };
      });
    }
    return createNormalizedError({ type: "VALIDATION", code, message, status, details });
  }

  if (status === 401) {
    return createNormalizedError({ type: "AUTHENTICATION", code, message, status });
  }

  if (status === 403) {
    return createNormalizedError({ type: "AUTHORIZATION", code, message, status });
  }

  if (status === 404) {
    return createNormalizedError({ type: "NOT_FOUND", code, message, status });
  }

  if (status === 409) {
    return createNormalizedError({ type: "CONFLICT", code, message, status });
  }

  if (status === 429) {
    return createNormalizedError({ type: "RATE_LIMIT", code, message, status, retryable: true });
  }

  if (status >= 500) {
    return createNormalizedError({ type: "SERVER", code, message, status, retryable: true });
  }

  return createNormalizedError({ type: "UNEXPECTED", code, message, status });
}

export function normalizeTransportError(error: unknown): NormalizedError {
  if (error instanceof DOMException && error.name === "AbortError") {
    return createNormalizedError({ type: "CANCELLATION", code: "REQUEST_CANCELLED", message: "Request was cancelled" });
  }

  if (error instanceof TypeError) {
    return createNormalizedError({
      type: "TRANSPORT",
      code: "NETWORK_FAILURE",
      message: error.message || "A network error occurred",
      retryable: true,
    });
  }

  return createNormalizedError({ type: "UNEXPECTED", code: "TRANSPORT_ERROR", message: getErrorMessage(error) });
}

export function normalizeTimeoutError(): NormalizedError {
  return createNormalizedError({
    type: "TIMEOUT",
    code: "REQUEST_TIMEOUT",
    message: "The request timed out",
    retryable: true,
  });
}

export function normalizeOfflineError(): NormalizedError {
  return createNormalizedError({
    type: "OFFLINE",
    code: "NO_NETWORK",
    message: "No internet connection available",
    retryable: true,
  });
}

export function normalizeCancellationError(): NormalizedError {
  return createNormalizedError({
    type: "CANCELLATION",
    code: "REQUEST_CANCELLED",
    message: "Request was cancelled",
    retryable: false,
  });
}

export function normalizeValidationError(errors: readonly FieldError[]): NormalizedError {
  return createNormalizedError({
    type: "VALIDATION",
    code: "VALIDATION_ERROR",
    message: "Validation failed",
    status: 422,
    details: errors,
  });
}

export function normalizeUnexpectedError(error: unknown): NormalizedError {
  return createNormalizedError({
    type: "UNEXPECTED",
    code: "UNEXPECTED_ERROR",
    message: getErrorMessage(error ?? undefined),
  });
}

export function normalizeError(error: unknown): NormalizedError {
  if (!error) {
    return normalizeUnexpectedError(undefined);
  }

  if (error instanceof Object && "type" in error && "code" in error && "message" in error) {
    const maybe = error as Partial<NormalizedError>;
    if (maybe.type && isErrorType(maybe.type)) {
      return error as NormalizedError;
    }
  }

  if (error instanceof DOMException) {
    if (error.name === "AbortError") {
      return normalizeCancellationError();
    }
  }

  if (error instanceof TypeError) {
    return normalizeTransportError(error);
  }

  if (error instanceof Error) {
    if (error.name === "TimeoutError" || (error.message && error.message.includes("timed out"))) {
      return normalizeTimeoutError();
    }
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return normalizeOfflineError();
  }

  return normalizeUnexpectedError(error);
}

export function isRetryable(error: NormalizedError): boolean {
  return error.retryable;
}

export function isErrorType(value: string): value is ErrorType {
  const validTypes: readonly string[] = [
    "TRANSPORT", "TIMEOUT", "AUTHENTICATION", "AUTHORIZATION",
    "VALIDATION", "NOT_FOUND", "CONFLICT", "RATE_LIMIT",
    "SERVER", "OFFLINE", "CANCELLATION", "UNEXPECTED",
  ];
  return validTypes.includes(value);
}

export function classifyResponse(status: number): {
  category: "success" | "redirect" | "client_error" | "server_error" | "network_failure";
  isError: boolean;
} {
  if (status >= 200 && status < 300) return { category: "success", isError: false };
  if (status >= 300 && status < 400) return { category: "redirect", isError: false };
  if (status >= 400 && status < 500) return { category: "client_error", isError: true };
  if (status >= 500) return { category: "server_error", isError: true };
  return { category: "network_failure", isError: true };
}

export function getRetryDelay(_error: NormalizedError, attempt: number, config: {
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  jitter: boolean;
}): number {
  const delay = Math.min(config.baseDelayMs * config.backoffFactor ** attempt, config.maxDelayMs);
  if (!config.jitter) return delay;
  return delay * (0.5 + Math.random() * 0.5);
}
