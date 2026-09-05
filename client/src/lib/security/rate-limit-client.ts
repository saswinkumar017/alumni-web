const rateLimitState: Record<string, { count: number; resetAt: number }> = {};

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 60000,
};

export function checkRateLimit(key: string, config: RateLimitConfig = DEFAULT_CONFIG): boolean {
  const now = Date.now();
  const state = rateLimitState[key];

  if (!state || now > state.resetAt) {
    rateLimitState[key] = { count: 1, resetAt: now + config.windowMs };
    return true;
  }

  if (state.count >= config.maxAttempts) {
    return false;
  }

  state.count += 1;
  return true;
}

export function getRateLimitRemaining(key: string): number {
  const now = Date.now();
  const state = rateLimitState[key];
  if (!state || now > state.resetAt) return DEFAULT_CONFIG.maxAttempts;
  return Math.max(0, DEFAULT_CONFIG.maxAttempts - state.count);
}

export function getRateLimitResetAt(key: string): number {
  const now = Date.now();
  const state = rateLimitState[key];
  if (!state || now > state.resetAt) return now;
  return state.resetAt;
}

export function resetRateLimit(key: string): void {
  delete rateLimitState[key];
}

export function clearAllRateLimits(): void {
  for (const key of Object.keys(rateLimitState)) {
    delete rateLimitState[key];
  }
}