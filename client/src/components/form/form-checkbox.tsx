/**
 * FormCheckbox renders a controlled checkbox using Radix UI primitive.
 *
 * @alpha No proven cross-feature reuse yet. Client Component.
 * @example
 * ```tsx
 * <FormCheckbox label="Notify me" checked={notify} onCheckedChange={setNotify} />
 * ```
 */

"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormCheckboxProps {
  label: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export default function FormCheckbox({
  label,
  checked,
  onCheckedChange,
  disabled,
  className,
}: FormCheckboxProps) {
  return (
    <label className={cn("flex items-center gap-3", className)}>
      <CheckboxPrimitive.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded border border-zinc-300 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900/20:ring-zinc-50/20",
          "data-[state=checked]:bg-zinc-900 data-[state=checked]:text-white[state=checked]:bg-zinc-50[state=checked]:text-zinc-900",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <CheckboxPrimitive.Indicator>
          <Check className="h-3 w-3" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <span className="text-sm text-zinc-700">{label}</span>
    </label>
  );
}
