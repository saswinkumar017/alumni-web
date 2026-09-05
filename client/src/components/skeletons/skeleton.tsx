/**
 * Skeleton renders an animated placeholder block for loading states.
 *
 * @stable SkeletonBlock used by 2 features (directory, events) and app layouts.
 * Skeleton and SkeletonCard are @alpha (single-consumer).
 * Server Component; uses CSS animation from tailwind.config.
 *
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-full" />
 * <SkeletonCard />
 * <SkeletonBlock />
 * ```
 */
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-skeleton rounded bg-zinc-200", className)} />;
}

export function SkeletonBlock({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-4 w-full", className)} />;
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-xl border border-zinc-200 p-6", className)}>
      <Skeleton className="mb-4 h-5 w-2/3" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}
