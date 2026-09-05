import { notFound } from "next/navigation";
import { getEvent, getPastEvents, getUpcomingEvents } from "@/lib/data/events";
import type { Event as AlumniEvent } from "@/types";
import { EventFormSection } from "./_sections/event-form-section";
import { EventInfoSection, EventInfoSectionSkeleton } from "./_sections/event-info-section";
import { EventsHeaderSection } from "./_sections/events-header-section";
import { EventsListSection, type EventSummary } from "./_sections/events-list-section";

function toSummary(event: AlumniEvent): EventSummary {
  return {
    id: event.id,
    title: event.title,
    date: new Date(event.date).toLocaleDateString(),
    description: event.description,
  };
}

export async function EventsList() {
  const [upcoming, past] = await Promise.all([getUpcomingEvents(), getPastEvents()]);

  return (
    <div>
      <EventsHeaderSection
        heading="Events"
        description="Stay connected with upcoming and past alumni events."
      />
      <EventsListSection
        events={(upcoming.success ? upcoming.data : []).map(toSummary)}
        emptyMessage="No upcoming events at the moment."
      />
      <EventsListSection
        events={(past.success ? past.data : []).map(toSummary)}
        emptyMessage="No past events to show yet."
      />
    </div>
  );
}

export async function EventDetail({ slug }: { slug: string }) {
  const result = await getEvent(slug);
  if (!result.success) notFound();
  const event = result.data;

  return <EventInfoSection event={event} />;
}

export function EventDetailSkeleton() {
  return <EventInfoSectionSkeleton />;
}

export async function AlumniEventsList() {
  const [upcoming, past] = await Promise.all([getUpcomingEvents(), getPastEvents()]);

  return (
    <div>
      <EventsHeaderSection heading="Events" description="Browse upcoming and past alumni events." />
      <EventsListSection
        events={(upcoming.success ? upcoming.data : []).map(toSummary)}
        emptyMessage="No upcoming events at the moment."
      />
      <EventsListSection
        events={(past.success ? past.data : []).map(toSummary)}
        emptyMessage="No past events to show yet."
      />
    </div>
  );
}

export async function AlumniEventDetail({ id }: { id: string }) {
  const result = await getEvent(id);
  if (!result.success) notFound();
  const event = result.data;

  return <EventInfoSection event={event} headingTag="h1" className="" />;
}

export function AlumniEventDetailSkeleton() {
  return <div className="animate-skeleton h-4 w-48 rounded bg-zinc-200" />;
}

export function AdminEventsList() {
  return (
    <div>
      <EventsHeaderSection
        heading="Events Management"
        description="Create and manage alumni events."
      />
    </div>
  );
}

export function AdminEventDetail({ id }: { id: string }) {
  return <EventFormSection mode="edit" initialData={{ title: `Event ${id}` }} />;
}

export function AdminEventEditor() {
  return <EventFormSection mode="create" />;
}
