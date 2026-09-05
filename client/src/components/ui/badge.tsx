/**
 * Badge renders a small label for status, count, or categorization.
 *
 * @alpha Introduced in v0.3.0. No proven cross-feature reuse yet.
 * Server Component; supports visual variant and feedback axes.
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * ```
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const badgeVariants = {
  default: "bg-surface-hover text-text-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
