/**
 * DescriptionList renders a definition list as key-value pairs.
 *
 * @alpha Used by 1 feature (directory). Promote when a second feature proves need.
 * Server Component; renders `<dl>` with `<dt>`/`<dd>` pairs.
 * @example
 * ```tsx
 * <DescriptionList items={[{ term: "Email", description: "user@example.com" }]} />
 * ```
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DescriptionListItem {
  term: string;
  description: string;
}

export interface DescriptionListProps {
  items: DescriptionListItem[];
  className?: string;
}

export function DescriptionList({ items, className }: DescriptionListProps) {
  if (items.length === 0) return null;

  return (
    <dl className={cn("space-y-2", className)}>
      {items.map((item) => (
        <div key={item.term} className="flex gap-2">
          <dt className="text-sm font-medium text-zinc-500">{item.term}</dt>
          <dd className="text-sm text-zinc-900">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}

export interface DescriptionListBlockProps {
  children: ReactNode;
  className?: string;
}

export function DescriptionListBlock({ children, className }: DescriptionListBlockProps) {
  return <dl className={cn("space-y-2", className)}>{children}</dl>;
}
