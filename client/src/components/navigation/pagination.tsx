/**
 * Pagination renders page navigation with prev/next and numbered buttons.
 *
 * @alpha No proven cross-feature reuse yet. Client Component.
 * Renders semantic `<nav aria-label="Pagination">` with proper aria-current.
 * @example
 * ```tsx
 * <Pagination currentPage={1} totalPages={10} onPageChange={setPage} />
 * ```
 */

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav aria-label="Pagination" className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="inline-flex items-center justify-center rounded-md p-2 text-zinc-600 hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-50:bg-zinc-800"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((page, index) =>
        page === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="inline-flex h-8 w-8 items-center justify-center text-sm text-zinc-400"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            disabled={page === currentPage}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-zinc-900/20:ring-zinc-50/20",
              page === currentPage
                ? "bg-accent-solid text-white"
                : "text-zinc-600 hover:bg-zinc-100:bg-zinc-800",
            )}
            aria-current={page === currentPage ? "page" : undefined}
            aria-label={`Page ${page}`}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="inline-flex items-center justify-center rounded-md p-2 text-zinc-600 hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-30:bg-zinc-800"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
