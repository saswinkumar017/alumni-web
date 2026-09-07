import type { ReactNode } from "react";

/**
 * Topbar renders the top header bar with title and action buttons.
 *
 * @alpha Used indirectly through AuthenticatedShell. Not yet directly imported by any feature.
 */
interface TopbarProps {
  title: string;
  actions?: ReactNode;
}

export function Topbar({ title, actions }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/95 pl-14 pr-4 backdrop-blur-sm sm:pr-6 lg:pl-6">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      {actions && <div className="flex items-center gap-2 sm:gap-3">{actions}</div>}
    </header>
  );
}
