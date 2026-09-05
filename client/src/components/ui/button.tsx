/**
 * Button renders a clickable action element with visual variants.
 *
 * @stable Used by 6 features (dashboard, events, jobs, messages, networking, profile).
 * Supports visual, size, and interaction variants via semantic tokens.
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Submit
 * </Button>
 * ```
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const variantStyles = {
  primary:
    "bg-accent-solid text-accent-solid-foreground hover:bg-accent-solid-hover",
  secondary:
    "border border-border-default text-text-secondary hover:bg-surface-hover",
  success: "bg-success text-success-foreground hover:brightness-90",
  danger: "bg-danger text-danger-foreground hover:brightness-90",
};

const sizeStyles = {
  sm: "rounded-sm px-3 py-1 text-xs",
  md: "rounded-md px-4 py-2 text-sm",
  lg: "rounded-md px-6 py-2 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors duration-100 ease-out",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
