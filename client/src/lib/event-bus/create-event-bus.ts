import type { AppEvent } from "@/types";
import type { EventBus, EventHandler, EventPayload, Unsubscribe } from "./types";

type HandlerMap = Map<string, Set<(payload: unknown) => void>>;

export function createEventBus(): EventBus {
  const handlers: HandlerMap = new Map();

  function on<E extends AppEvent["type"]>(event: E, handler: EventHandler<E>): Unsubscribe {
    if (!handlers.has(event)) {
      handlers.set(event, new Set());
    }
    const set = handlers.get(event)!;
    set.add(handler as (payload: unknown) => void);

    return () => {
      set.delete(handler as (payload: unknown) => void);
      if (set.size === 0) {
        handlers.delete(event);
      }
    };
  }

  function emit<E extends AppEvent["type"]>(event: E, payload: EventPayload<E>): void {
    const set = handlers.get(event);
    if (!set) return;
    for (const handler of set) {
      handler(payload);
    }
  }

  function off<E extends AppEvent["type"]>(event: E, handler: EventHandler<E>): void {
    const set = handlers.get(event);
    if (!set) return;
    set.delete(handler as (payload: unknown) => void);
    if (set.size === 0) {
      handlers.delete(event);
    }
  }

  function clear(): void {
    handlers.clear();
  }

  return { on, emit, off, clear };
}
