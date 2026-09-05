/**
 * StatusIndicator renders a colored dot with optional label for status.
 *
 * @alpha No proven cross-feature reuse yet. Server Component.
 * Supports online, offline, away, and busy status variants.
 * @example
 * ```tsx
 * <StatusIndicator status="online" label="Online" />
 * ```
 */

import { cn } from "@/lib/utils";

export interface StatusIndicatorProps {
  status: "online" | "offline" | "away" | "busy";
  label?: string;
  className?: string;
}

const statusStyles = {
  online: "bg-emerald-500",
  offline: "bg-zinc-400",
  away: "bg-amber-500",
  busy: "bg-red-500",
};

export default function StatusIndicator({ status, label, className }: StatusIndicatorProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn("block h-2.5 w-2.5 rounded-full", statusStyles[status])}
        aria-hidden="true"
      />
      {label && <span className="text-sm text-zinc-600">{label}</span>}
    </span>
  );
}
