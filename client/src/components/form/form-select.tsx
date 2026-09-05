/**
 * FormSelect renders a styled select dropdown with placeholder and chevron.
 *
 * @alpha No proven cross-feature reuse yet. Client Component.
 * @example
 * ```tsx
 * <FormSelect options={[{ value: "active", label: "Active" }]} placeholder="Select status" />
 * ```
 */

"use client";

import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: SelectOption[];
  placeholder?: string;
}

export default function FormSelect({ options, placeholder, className, ...props }: FormSelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          "w-full appearance-none rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-8 text-sm text-zinc-900 transition-colors focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20:border-zinc-50:ring-zinc-50/20",
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
        aria-hidden="true"
      />
    </div>
  );
}
