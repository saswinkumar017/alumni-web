/**
 * Breadcrumb renders a navigation trail with home icon and page hierarchy.
 *
 * @alpha No proven cross-feature reuse yet. Server Component.
 * Renders semantic `<nav aria-label="Breadcrumb">` with proper aria-current.
 * @example
 * ```tsx
 * <Breadcrumb items={[{ label: "Events", href: "/events" }, { label: "Current" }]} />
 * ```
 */

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export default function Breadcrumb({ items, showHome = true, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm", className)}>
      {showHome && (
        <>
          <Link
            href="/"
            className="text-zinc-500 hover:text-zinc-900:text-zinc-50"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4 text-zinc-400" aria-hidden="true" />
        </>
      )}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-1">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-zinc-500 hover:text-zinc-900:text-zinc-50"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="text-zinc-900"
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight
                className="h-4 w-4 text-zinc-400"
                aria-hidden="true"
              />
            )}
          </span>
        );
      })}
    </nav>
  );
}
