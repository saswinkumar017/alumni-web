/**
 * Checkbox renders a native checkbox input with label.
 *
 * @alpha Introduced in v0.3.0. No proven cross-feature reuse yet.
 * Client Component; wraps native `<input type="checkbox">`.
 * @example
 * ```tsx
 * <Checkbox id="agree" label="I agree to the terms" />
 * ```
 */

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export default function Checkbox({ label, id, className, ...props }: CheckboxProps) {
  return (
    <label className={cn("flex items-center gap-3", className)}>
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-zinc-300"
        {...props}
      />
      <span className="text-sm text-zinc-700">{label}</span>
    </label>
  );
}
