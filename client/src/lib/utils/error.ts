export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) return String((error as Record<string, unknown>).message);
  return "An unknown error occurred";
}

export function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) return String((error as Record<string, unknown>).code);
  return undefined;
}

export function safeExecute<T>(fn: () => T): [T | null, Error | null] {
  try {
    return [fn(), null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

export function isAppError(error: unknown): boolean {
  return error instanceof Error;
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === "Failed to fetch") return true;
  if (error && typeof error === "object" && "name" in error && error.name === "AbortError") return true;
  return false;
}

export function createAppError(message: string, code?: string): Error & { code?: string } {
  const error = new Error(message) as Error & { code?: string };
  if (code) error.code = code;
  return error;
}