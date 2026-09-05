interface CacheEntry<T> {
  data: T;
  tags: readonly string[];
  createdAt: number;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSet<T>(key: string, data: T, ttlMs = 300_000, tags?: readonly string[]): void {
  store.set(key, {
    data,
    tags: tags ?? [],
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  });
}

export function cacheDelete(key: string): void {
  store.delete(key);
}

export function cacheInvalidateByTag(tag: string): void {
  for (const [key, entry] of store) {
    if (entry.tags.includes(tag)) {
      store.delete(key);
    }
  }
}

export function cacheInvalidateByPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

export function cacheClear(): void {
  store.clear();
}

export function cacheSize(): number {
  return store.size;
}

export function cacheKeys(): readonly string[] {
  return [...store.keys()];
}