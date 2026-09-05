/**
 * Toast renders the sonner toast provider with default styling.
 *
 * @alpha No proven cross-feature reuse yet. Client Component.
 * Wraps Sonner's Toaster with project theme tokens.
 * @example
 * ```tsx
 * <Toast />
 * // Then call toast("Message") from sonner
 * ```
 */

"use client";

import { Toaster as SonnerToaster } from "sonner";
import { cn } from "@/lib/utils";

export interface ToastProps {
  className?: string;
}

export default function Toast({ className }: ToastProps) {
  return (
    <SonnerToaster
      className={cn("pointer-events-auto", className)}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-lg group-[.toaster]:border group-[.toaster]:border-zinc-200 group-[.toaster]:bg-white group-[.toaster]:text-zinc-900 group-[.toaster]:shadow-lg[.toaster]:border-zinc-800[.toaster]:bg-zinc-900[.toaster]:text-zinc-50",
          description: "group-[.toast]:text-zinc-500[.toast]:text-zinc-400",
          actionButton:
            "group-[.toast]:bg-zinc-900 group-[.toast]:text-white[.toast]:bg-zinc-50[.toast]:text-zinc-900",
          cancelButton:
            "group-[.toast]:bg-zinc-100 group-[.toast]:text-zinc-500[.toast]:bg-zinc-800[.toast]:text-zinc-400",
        },
      }}
    />
  );
}
