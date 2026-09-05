/**
 * Avatar renders a user avatar image with fallback initials.
 *
 * @alpha No proven cross-feature reuse yet. Client Component (uses Radix UI).
 * Supports sm/md/lg sizes and automatic image fallback.
 * @example
 * ```tsx
 * <Avatar src="/user.jpg" alt="John Doe" fallback="JD" size="md" />
 * ```
 */

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";


export interface AvatarProps {
  src?: string;
  alt: string;
  fallback: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

export default function Avatar({ src, alt, fallback, size = "md", className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full bg-zinc-100",
        sizeStyles[size],
        className,
      )}
    >
      <AvatarPrimitive.Image src={src} alt={alt} className="h-full w-full object-cover" />
      <AvatarPrimitive.Fallback className="font-medium text-zinc-600">
        {fallback}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
