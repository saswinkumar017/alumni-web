/**
 * FormField wraps a form input with label, hint, and error display.
 *
 * @alpha No proven cross-feature reuse yet. Client Component.
 * @example
 * ```tsx
 * <FormField label="Email" error="Required">
 *   <input type="email" />
 * </FormField>
 * ```
 */

"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
  className?: string;
}

export default function FormField({
  label,
  error,
  hint,
  children,
  required = false,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="text-sm font-medium text-zinc-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
