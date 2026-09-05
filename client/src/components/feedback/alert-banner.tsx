/**
 * AlertBanner renders a contextual alert with icon, title, and optional dismiss.
 *
 * @alpha No proven cross-feature reuse yet. Server Component.
 * Supports info, success, warning, and error variants with matching icons.
 * @example
 * ```tsx
 * <AlertBanner variant="info" title="Notice">System maintenance tonight.</AlertBanner>
 * ```
 */

import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AlertBannerProps {
  variant: "info" | "success" | "warning" | "error";
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const variantStyles = {
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800",
  error:
    "border-red-200 bg-red-50 text-red-800",
};

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

export default function AlertBanner({
  variant,
  title,
  children,
  onDismiss,
  className,
}: AlertBannerProps) {
  const Icon = icons[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4",
        variantStyles[variant],
        className,
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        {title && <p className="text-sm font-medium">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-1 hover:opacity-70"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
