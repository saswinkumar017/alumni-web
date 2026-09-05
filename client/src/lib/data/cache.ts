import type { CacheEntry, CacheRequestConfig } from "./types";

export class CacheStore {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly tagIndex = new Map<string, Set<string>>();

  private createKey(key: string): string {
    return `cache:${key}`;
  }

  get<T>(key: string): { data: T; isStale: boolean } | null {
    const internalKey = this.createKey(key);
    const entry = this.store.get(internalKey);
    if (!entry) return null;

    const now = Date.now();
    const isStale = now >= entry.expiresAt;

    if (now >= entry.staleAt) {
      this.store.delete(internalKey);
      this.removeFromTagIndex(internalKey);
      return null;
    }

    return { data: entry.data as T, isStale };
  }

  set<T>(key: string, data: T, config?: CacheRequestConfig): void {
    const internalKey = this.createKey(key);
    const now = Date.now();
    const ttlMs = config?.ttlMs ?? 5 * 60 * 1000;
    const swrMs = ttlMs * 2;

    const entry: CacheEntry<T> = {
      data,
      tags: config?.tags ?? [],
      createdAt: now,
      expiresAt: now + ttlMs,
      staleAt: now + ttlMs + swrMs,
    };

    this.store.set(internalKey, entry);

    for (const tag of entry.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(internalKey);
    }
  }

  invalidate(tag: string): void {
    const keys = this.tagIndex.get(tag);
    if (!keys) return;

    for (const key of keys) {
      this.store.delete(key);
    }
    this.tagIndex.delete(tag);
  }

  invalidateTags(tags: readonly string[]): void {
    for (const tag of tags) {
      this.invalidate(tag);
    }
  }

  invalidatePattern(pattern: RegExp): void {
    for (const [key] of this.store) {
      if (pattern.test(key)) {
        this.store.delete(key);
        this.removeFromTagIndex(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
    this.tagIndex.clear();
  }

  get size(): number {
    return this.store.size;
  }

  get tags(): readonly string[] {
    return Array.from(this.tagIndex.keys());
  }

  private removeFromTagIndex(key: string): void {
    for (const [, keys] of this.tagIndex) {
      keys.delete(key);
    }
  }

  getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    config?: CacheRequestConfig,
  ): Promise<{ data: T; fromCache: boolean; isStale: boolean }> {
    if (config?.skipCache) {
      return fetcher().then((data) => {
        this.set(key, data, config);
        return { data, fromCache: false, isStale: false };
      });
    }

    const cached = this.get<T>(key);
    if (cached) {
      if (cached.isStale && config?.staleWhileRevalidate !== false) {
        fetcher()
          .then((fresh) => this.set(key, fresh, config))
          .catch(() => {});
      }
      return Promise.resolve({ data: cached.data, fromCache: true, isStale: cached.isStale });
    }

    return fetcher().then((data) => {
      this.set(key, data, config);
      return { data, fromCache: false, isStale: false };
    });
  }
}

export const cacheStore = new CacheStore();
