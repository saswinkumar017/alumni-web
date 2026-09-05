/**
 * ProgressIndicator renders a progress bar using Radix UI progress primitive.
 *
 * @alpha No proven cross-feature reuse yet. Client Component.
 * Supports sm/md sizes, default/success/warning visual variants.
 * @example
 * ```tsx
 * <ProgressIndicator value={65} variant="success" size="md" />
 * ```
 */

"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export interface ProgressIndicatorProps {
  value: number;
  max?: number;
  size?: "sm" | "md";
  variant?: "default" | "success" | "warning";
  className?: string;
}

const sizeStyles = {
  sm: "h-1.5",
  md: "h-2.5",
};

const variantStyles = {
  default: "bg-accent-solid",
  success: "bg-success",
  warning: "bg-warning",
};

export default function ProgressIndicator({
  value,
  max = 100,
  size = "md",
  variant = "default",
  className,
}: ProgressIndicatorProps) {
  const clampedValue = Math.min(value, max);
  const percentage = max > 0 ? Math.round((clampedValue / max) * 100) : 0;

  return (
    <ProgressPrimitive.Root
      className={cn(
        "overflow-hidden rounded-full bg-surface-hover",
        sizeStyles[size],
        className,
      )}
      value={percentage}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full rounded-full transition-all duration-300",
          variantStyles[variant],
        )}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
