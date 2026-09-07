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
  image?: string | null;
  maxAttendees?: number | null;
  customFields?: Record<string, unknown> | null;
  headingTag?: "h1" | "h2";
  children?: ReactNode;
}

function prettifyKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderValue(value: unknown): ReactNode {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" && /^https?:\/\//.test(value)) {
    return (
      <a href={value} target="_blank" rel="noreferrer" className="text-zinc-900 underline hover:text-zinc-700">
        {value}
      </a>
    );
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function EventInfo({
  title,
  description,
  date,
  location,
  image,
  maxAttendees,
  customFields,
  headingTag: Heading = "h1",
  children,
}: EventInfoProps) {
  const paragraphs = description
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const entries = Object.entries(customFields ?? {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );

  return (
    <>
      <Heading className="text-4xl font-bold tracking-tight text-zinc-900">
        {title}
      </Heading>
      {(date || location) && (
        <p className="mt-2 text-sm text-zinc-500">
          {[date, location].filter(Boolean).join(" · ")}
        </p>
      )}
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={`${title} cover`}
          className="mt-6 aspect-video w-full rounded-2xl border border-zinc-200 object-cover"
        />
      )}
      <div className="mt-6 space-y-4">
        {paragraphs.length > 0 ? (
          paragraphs.map((p) => (
            <p key={p.slice(0, 48)} className="text-lg leading-8 text-zinc-600">
              {p}
            </p>
          ))
        ) : (
          <p className="text-lg text-zinc-600">{description}</p>
        )}
      </div>
      {(maxAttendees != null || entries.length > 0) && (
        <dl className="mt-8 rounded-xl border border-zinc-200 bg-white p-5">
          {maxAttendees != null && (
            <div className="flex gap-3 py-1.5 text-sm">
              <dt className="w-36 shrink-0 font-medium text-zinc-500">Seats</dt>
              <dd className="text-zinc-900">{maxAttendees}</dd>
            </div>
          )}
          {entries.map(([key, value]) => (
            <div key={key} className="flex gap-3 py-1.5 text-sm">
              <dt className="w-36 shrink-0 font-medium text-zinc-500">
                {prettifyKey(key)}
              </dt>
              <dd className="break-words text-zinc-900">{renderValue(value)}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
    </>
  );
}
