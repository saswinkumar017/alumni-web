export type ServiceErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "NETWORK_ERROR"
  | "TIMEOUT_ERROR"
  | "SERVER_ERROR"
  | "UNEXPECTED_ERROR";

export interface ServiceError {
  readonly code: ServiceErrorCode;
  readonly message: string;
  readonly detail: string;
  readonly field?: string;
  readonly cause?: unknown;
  readonly retryable: boolean;
}

export type ServiceResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: ServiceError };

export function createServiceError(
  code: ServiceErrorCode,
  message: string,
  detail?: string,
  field?: string,
  cause?: unknown,
): ServiceError {
  return {
    code,
    message,
    detail: detail ?? message,
    field,
    cause,
    retryable: code === "NETWORK_ERROR" || code === "TIMEOUT_ERROR" || code === "SERVER_ERROR",
  };
}

export function successResult<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

export function failureResult<T>(error: ServiceError): ServiceResult<T> {
  return { success: false, error };
}

export function isRetryableError(code: ServiceErrorCode): boolean {
  return code === "NETWORK_ERROR" || code === "TIMEOUT_ERROR" || code === "SERVER_ERROR";
}
