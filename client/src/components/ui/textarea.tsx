/**
 * Textarea renders a labeled multi-line text input.
 *
 * @alpha Used by 1 feature (events). Promote when a second feature proves need.
 * Client Component; extends native `<textarea>` attributes.
 * @example
 * ```tsx
 * <Textarea id="bio" label="Biography" rows={4} />
 * ```
 */

import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export default function Textarea({ label, id, className, ...props }: TextareaProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <textarea
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
