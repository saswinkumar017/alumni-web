// Component: QuickActionLink
// Rendering: Server
// Data: Props-only
// Interaction: Reactive (navigation)

import type { ReactNode } from "react";

export interface QuickActionLinkProps {
  label: string;
  href: string;
  icon?: ReactNode;
}

export default function QuickActionLink({ label, href, icon }: QuickActionLinkProps) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50:bg-zinc-800"
    >
      {icon}
      {label}
    </a>
  );
}
