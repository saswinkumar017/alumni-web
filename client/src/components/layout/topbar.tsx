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
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white pl-14 pr-6 lg:pl-6">
      <h2 className="text-sm font-medium text-zinc-500">{title}</h2>
      {actions && <div className="flex items-center gap-4">{actions}</div>}
    </header>
  );
}
