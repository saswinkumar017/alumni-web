import type { AppEvent } from "@/types";

export type EventPayload<E extends AppEvent["type"]> = Extract<AppEvent, { type: E }>["payload"];

export type EventHandler<E extends AppEvent["type"]> = (payload: EventPayload<E>) => void;

export type Unsubscribe = () => void;

export interface EventBus {
  on: <E extends AppEvent["type"]>(event: E, handler: EventHandler<E>) => Unsubscribe;
  emit: <E extends AppEvent["type"]>(event: E, payload: EventPayload<E>) => void;
  off: <E extends AppEvent["type"]>(event: E, handler: EventHandler<E>) => void;
  clear: () => void;
}
