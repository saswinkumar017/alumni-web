export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race<T>([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)),
  ]);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number; maxDelay?: number } = {},
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 30000 } = options;
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = Math.min(baseDelay * 2 ** attempt, maxDelay) + Math.random() * 1000;
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

export async function concurrentPool<T, U>(
  items: T[],
  fn: (item: T) => Promise<U>,
  concurrency = 4,
): Promise<U[]> {
  const results: (U | undefined)[] = new Array(items.length);
  const executing: Promise<void>[] = [];
  let index = 0;

  async function enqueue(): Promise<void> {
    if (index >= items.length) return;
    const currentIndex = index++;
    const item = items[currentIndex]!;
    const task = fn(item).then((result) => { results[currentIndex] = result; });
    executing.push(task);
    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
    executing.splice(
      executing.findIndex((p) => p === task),
      1,
    );
    await enqueue();
  }

  await enqueue();
  await Promise.all(executing);
  return results as U[];
}

export async function safePromise<T>(promise: Promise<T>): Promise<[T | null, unknown]> {
  try {
    return [await promise, null];
  } catch (error) {
    return [null, error];
  }
}

export function isPromise(value: unknown): value is Promise<unknown> {
  return typeof value === "object" && value !== null && "then" in value && typeof (value as Promise<unknown>).then === "function";
}

export function defer<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (reason: unknown) => void } {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}