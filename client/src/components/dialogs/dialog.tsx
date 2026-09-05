/**
 * Dialog renders a modal overlay with header, content, and footer slots.
 *
 * @alpha Not yet consumed by any feature. Uses compound component pattern:
 * Dialog → DialogHeader + DialogTitle → children → DialogFooter.
 * Accessible via ARIA dialog role and focus trapping (future enhancement).
 *
 * @example
 * ```tsx
 * <Dialog open={isOpen} onClose={handleClose}>
 *   <DialogHeader>
 *     <DialogTitle>Confirm</DialogTitle>
 *   </DialogHeader>
 *   <p>Are you sure?</p>
 *   <DialogFooter>
 *     <Button>Cancel</Button>
 *     <Button>Save</Button>
 *   </DialogFooter>
 * </Dialog>
 * ```
 */

"use client";

import { type ReactNode, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function DialogSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="h-6 w-1/3 rounded bg-surface-skeleton animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-surface-skeleton animate-pulse" />
        <div className="h-4 w-4/5 rounded bg-surface-skeleton animate-pulse" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <div className="h-9 w-20 rounded bg-surface-skeleton animate-pulse" />
        <div className="h-9 w-20 rounded bg-surface-skeleton animate-pulse" />
      </div>
    </div>
  );
}

export default function Dialog({ open, onClose, children, className, size = "md" }: DialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center" onClick={onClose} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClose(); }} role="button" tabIndex={-1} aria-label="Close">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "relative z-10 w-full rounded-lg border border-border-default bg-surface-card p-inset-md shadow-lg",
            sizeStyles[size],
            className,
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-lg font-semibold text-text-primary", className)}>{children}</h2>
  );
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mt-6 flex items-center justify-end gap-2", className)}>{children}</div>
  );
}