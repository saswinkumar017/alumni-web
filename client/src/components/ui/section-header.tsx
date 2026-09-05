/**
 * SectionHeader renders a section heading with optional sr-only support.
 *
 * @stable Used by 7 features (dashboard, directory, events, jobs, messages, networking, profile).
 * Server Component; accepts `as` prop for semantic heading level.
 * @example
 * ```tsx
 * <SectionHeader title="Recent Activity" as="h2" />
 * ```
 */

import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  title: string;
  as?: "h1" | "h2" | "h3";
  srOnly?: boolean;
  className?: string;
  id?: string;
}

export default function SectionHeader({
  title,
  as: Tag = "h2",
  srOnly,
  className,
  id,
}: SectionHeaderProps) {
  return (
    <Tag
      id={id}
      className={cn(
        srOnly ? "sr-only" : "text-lg font-semibold text-zinc-900",
        className,
      )}
    >
      {title}
    </Tag>
  );
}
