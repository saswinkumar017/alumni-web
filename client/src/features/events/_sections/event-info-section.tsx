// Section: EventInfoSection
// Rendering: Server
// Data: Props-only (receives event detail from Feature)
// Interaction: Passive (display only)

import type { ReactNode } from "react";
import { SkeletonBlock } from "@/components/skeletons";
import EventInfo from "../_components/event-info";

export interface EventDetailData {
  title: string;
  description: string;
  date?: string;
  location?: string;
}

export interface EventInfoSectionProps {
  event: EventDetailData;
  headingTag?: "h1" | "h2";
  className?: string;
  children?: ReactNode;
}

export function EventInfoSection({
  event,
  headingTag = "h1",
  className = "mx-auto max-w-3xl",
  children,
}: EventInfoSectionProps) {
  return (
    <section
      aria-labelledby="event-info-heading"
      className={`${className} px-4 py-16 sm:px-6 lg:px-8`}
    >
      <EventInfo
        title={event.title}
        description={event.description}
        date={event.date}
        location={event.location}
        headingTag={headingTag}
      >
        {children}
      </EventInfo>
    </section>
  );
}

export function EventInfoSectionSkeleton({
  className = "mx-auto max-w-3xl",
}: {
  className?: string;
}) {
  return (
    <div className={`${className} px-4 py-16 sm:px-6 lg:px-8`}>
      <div className="h-10 w-64 animate-skeleton rounded bg-zinc-200" />
      <div className="mt-6 space-y-3">
        <SkeletonBlock />
        <div className="h-4 w-4/5 animate-skeleton rounded bg-zinc-200" />
      </div>
    </div>
  );
}
