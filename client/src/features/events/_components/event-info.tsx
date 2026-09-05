// Component: EventInfo
// Rendering: Server
// Data: Props-only
// Interaction: Passive

import type { ReactNode } from "react";

export interface EventInfoProps {
  title: string;
  description: string;
  date?: string;
  location?: string;
  headingTag?: "h1" | "h2";
  children?: ReactNode;
}

export default function EventInfo({
  title,
  description,
  date,
  location,
  headingTag: Heading = "h1",
  children,
}: EventInfoProps) {
  return (
    <>
      <Heading className="text-4xl font-bold tracking-tight text-zinc-900">
        {title}
      </Heading>
      {date && <p className="mt-2 text-sm text-zinc-500">{date}</p>}
      {location && <p className="mt-1 text-sm text-zinc-500">{location}</p>}
      <p className="mt-4 text-lg text-zinc-600">{description}</p>
      {children}
    </>
  );
}
