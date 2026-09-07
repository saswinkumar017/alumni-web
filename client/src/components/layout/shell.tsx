import type { ReactNode } from "react";

/**
 * Shell renders the app layout grid with topbar, sidebar, and main content.
 *
 * @alpha Used indirectly through AuthenticatedShell. Not yet directly imported by any feature.
 */
interface ShellProps {
  topbar?: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  mobileDrawer?: ReactNode;
  sidebarCollapsed?: boolean;
}

export function Shell({ topbar, sidebar, children, mobileDrawer, sidebarCollapsed }: ShellProps) {
  return (
    <div
      className={
        (sidebarCollapsed
          ? "grid min-h-screen grid-cols-1 bg-zinc-100 lg:h-screen lg:grid-cols-[76px_1fr] lg:overflow-hidden"
          : "grid min-h-screen grid-cols-1 bg-zinc-100 lg:h-screen lg:grid-cols-[272px_1fr] lg:overflow-hidden") +
        (topbar ? " grid-rows-[auto_1fr]" : " grid-rows-[1fr]")
      }
    >
      {topbar && <div className="col-span-1 lg:col-span-2">{topbar}</div>}
      <aside
        aria-label="Sidebar navigation"
        className="hidden border-r border-zinc-200 bg-white lg:flex lg:min-h-0 lg:flex-col"
      >
        {sidebar}
      </aside>
      <main id="main-content" className="overflow-y-auto px-4 py-6 sm:px-6 lg:min-h-0 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
      {mobileDrawer}
    </div>
  );
}
