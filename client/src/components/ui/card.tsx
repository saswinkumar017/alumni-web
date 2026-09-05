/**
 * Card renders a bordered surface container for grouping content.
 *
 * @stable Used by 6 features (dashboard, directory, events, jobs, networking, profile).
 * Server Component by default; accepts `as` prop for semantic HTML.
 * @example
 * ```tsx
 * <Card>
 *   <p>Content goes here</p>
 * </Card>
 * ```
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps {
  children: ReactNode;
  className?: string;
  as?: "article" | "div";
}

export default function Card({ children, className, as: Tag = "div" }: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-lg border border-border-default bg-surface-card p-inset-sm",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
