import type { Event as AlumniEvent } from "@/types";
import { useNotificationsStore } from "@/stores";

export interface EventStoreAdapter {
  notifyEventCreated(event: AlumniEvent): void;
  notifyEventUpdated(event: AlumniEvent): void;
  notifyEventDeleted(eventId: string): void;
  notifyRsvpUpdated(eventId: string, status: string): void;
}

export function createEventStoreAdapter(): EventStoreAdapter {
  function notifyEventCreated(event: AlumniEvent): void {
    useNotificationsStore.getState().addNotification({
      type: "success",
      title: "Event Created",
      message: `"${event.title}" has been created.`,
    });
  }

  function notifyEventUpdated(event: AlumniEvent): void {
    useNotificationsStore.getState().addNotification({
      type: "info",
      title: "Event Updated",
      message: `"${event.title}" has been updated.`,
    });
  }

  function notifyEventDeleted(eventId: string): void {
    useNotificationsStore.getState().addNotification({
      type: "info",
      title: "Event Deleted",
      message: `Event "${eventId}" has been deleted.`,
    });
  }

  function notifyRsvpUpdated(eventId: string, status: string): void {
    useNotificationsStore.getState().addNotification({
      type: "success",
      title: "RSVP Updated",
      message: `Your RSVP for event "${eventId}" has been updated to "${status}".`,
    });
  }

  return { notifyEventCreated, notifyEventUpdated, notifyEventDeleted, notifyRsvpUpdated };
}