import type { ReactNode } from "react";

/**
 * Shell renders the app layout grid with topbar, sidebar, and main content.
 *
 * @alpha Used indirectly through AuthenticatedShell. Not yet directly imported by any feature.
 */
interface ShellProps {
  topbar: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  mobileDrawer?: ReactNode;
}

export function Shell({ topbar, sidebar, children, mobileDrawer }: ShellProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr] lg:grid-cols-[264px_1fr]">
      <div className="col-span-1 lg:col-span-2">{topbar}</div>
      <aside
        aria-label="Sidebar navigation"
        className="hidden border-r border-zinc-200 bg-white lg:flex lg:flex-col"
      >
        {sidebar}
      </aside>
      <main id="main-content" className="overflow-y-auto bg-zinc-50 p-6">
        {children}
      </main>
      {mobileDrawer}
    </div>
  );
}
