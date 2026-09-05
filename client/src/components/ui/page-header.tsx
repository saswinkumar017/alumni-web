/**
 * PageHeader renders a page-level heading with optional description.
 *
 * @alpha Used by 1 feature (events). Promote when a second feature proves need.
 * Server Component; accepts semantic heading level via `as` prop.
 * @example
 * ```tsx
 * <PageHeader heading="Events" description="Browse upcoming alumni events." />
 * ```
 */

import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  heading: string;
  description?: string;
  className?: string;
  as?: "h1" | "h2";
}

export default function PageHeader({
  heading,
  description,
  className,
  as: Tag = "h1",
}: PageHeaderProps) {
  return (
    <div className={cn("mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8", className)}>
      <Tag className="text-4xl font-bold tracking-tight text-zinc-900">
        {heading}
      </Tag>
      {description && (
        <p className="mt-4 text-lg text-zinc-600">{description}</p>
      )}
    </div>
  );
}
