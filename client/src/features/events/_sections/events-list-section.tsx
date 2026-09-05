// Section: EventsListSection
// Rendering: Server (initial) / Client (filter/sort)
// Data: Props-only (receives events from Feature)
// Interaction: Reactive (filter/sort)

import EmptyState from "@/components/ui/empty-state";
import SectionHeader from "@/components/ui/section-header";
import EventCard from "../_components/event-card";

export interface EventSummary {
  id: string;
  title: string;
  date: string;
  description: string;
}

export interface EventsListSectionProps {
  events: EventSummary[];
  emptyMessage?: string;
}

export function EventsListSection({ events, emptyMessage }: EventsListSectionProps) {
  if (events.length === 0) {
    return (
      <section
        aria-labelledby="events-list-heading"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <SectionHeader title="Events List" id="events-list-heading" srOnly />
        <EmptyState message={emptyMessage ?? "No events to display."} />
      </section>
    );
  }

  return (
    <section
      aria-labelledby="events-list-heading"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <SectionHeader title="Events List" id="events-list-heading" srOnly />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard
            key={event.id}
            id={event.id}
            title={event.title}
            date={event.date}
            description={event.description}
          />
        ))}
      </div>
    </section>
  );
}
