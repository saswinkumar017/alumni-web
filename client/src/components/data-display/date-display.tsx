/**
 * DateDisplay renders a formatted date with optional relative display.
 *
 * @alpha No proven cross-feature reuse yet. Server Component.
 * Formats dates via date-fns; supports absolute and relative modes.
 * @example
 * ```tsx
 * <DateDisplay date="2024-01-15" relative />
 * <DateDisplay date={new Date()} format="MMM d, yyyy" />
 * ```
 */

import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export interface DateDisplayProps {
  date: string | Date;
  format?: string;
  relative?: boolean;
  className?: string;
}

function normalizeDate(date: string | Date): Date {
  if (date instanceof Date && isValid(date)) return date;
  if (typeof date === "string") {
    const parsed = parseISO(date);
    if (isValid(parsed)) return parsed;
  }
  return new Date(NaN);
}

export default function DateDisplay({
  date,
  format: formatStr = "MMM d, yyyy",
  relative = false,
  className,
}: DateDisplayProps) {
  const normalized = normalizeDate(date);

  if (!isValid(normalized)) {
    return (
      <span className={cn("text-sm text-zinc-400", className)}>
        Invalid date
      </span>
    );
  }

  const displayText = relative
    ? formatDistanceToNow(normalized, { addSuffix: true })
    : format(normalized, formatStr);

  return (
    <time
      dateTime={normalized.toISOString()}
      className={cn("text-sm text-zinc-600", className)}
    >
      {displayText}
    </time>
  );
}
