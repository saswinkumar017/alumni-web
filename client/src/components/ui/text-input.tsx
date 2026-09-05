/**
 * TextInput renders a labeled text input field.
 *
 * @stable Used by 4 features (events, jobs, messages, profile).
 * Client Component; supports optional visible label and sr-only label.
 * @example
 * ```tsx
 * <TextInput id="name" label="Full Name" />
 * ```
 */

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  srOnlyLabel?: string;
}

export default function TextInput({ label, srOnlyLabel, id, className, ...props }: TextInputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      {srOnlyLabel && !label && (
        <label htmlFor={id} className="sr-only">
          {srOnlyLabel}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400",
          className,
        )}
        {...props}
      />
    </div>
  );
}
