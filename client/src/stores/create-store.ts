import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";

interface CreateStoreOptions<T> {
  name: string;
  version?: number;
  persist?: boolean;
  persistKey?: string;
  partialize?: (state: T) => Partial<T>;
  devtools?: boolean;
}

export function createStore<T extends { reset: () => void }>(
  initializer: (set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void, get: () => T) => T,
  options: CreateStoreOptions<T>,
) {
  const { name, persist: shouldPersist, persistKey, partialize, devtools: useDevtools } = options;

  if (shouldPersist && persistKey) {
    return create<T>()(
      devtools(
        subscribeWithSelector(
          persist(initializer, {
            name: persistKey,
            partialize: partialize ?? ((state) => state),
            version: options.version ?? 1,
          }),
        ),
        { name },
      ),
    );
  }

  if (useDevtools !== false) {
    return create<T>()(devtools(subscribeWithSelector(initializer), { name }));
  }

  return create<T>()(subscribeWithSelector(initializer));
}
