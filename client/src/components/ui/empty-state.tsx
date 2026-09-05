/**
 * EmptyState renders a placeholder message with optional icon and action.
 *
 * @stable Used by 6 features (dashboard, directory, events, jobs, messages, networking).
 * Server Component; configurable message, icon, and CTA via props.
 * @example
 * ```tsx
 * <EmptyState message="No items found." icon={<InboxIcon />} action={<Button>Add</Button>} />
 * ```
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ message, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("text-sm text-text-muted", className)}>
      {icon && <div className="mb-2">{icon}</div>}
      <p>{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
