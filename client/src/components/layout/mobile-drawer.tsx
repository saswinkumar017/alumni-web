/**
 * MobileDrawer renders a slide-in navigation drawer for mobile viewports.
 *
 * @alpha Used indirectly through AuthenticatedShell. Closes on route change.
 */
"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

interface MobileDrawerProps {
  children: ReactNode;
}

export function MobileDrawer({ children }: MobileDrawerProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is required to close drawer on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm focus:outline-none"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-zinc-200 bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-6">
              <span className="text-lg font-bold text-zinc-900">
                JJCET Alumni
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-zinc-600 hover:bg-zinc-100"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto p-4">
              {children}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
