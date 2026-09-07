"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { NavGroup } from "@/config/navigation";
import { MobileDrawer } from "./mobile-drawer";
import { Shell } from "./shell";
import { SidebarSection } from "./sidebar-section";

interface AuthenticatedShellProps {
  children: React.ReactNode;
  navGroups: NavGroup[];
  /** @deprecated Console sidebar carries branding; topbar removed. Kept for callers. */
  title?: string;
  branding: string;
  brandingHref: string;
  onSignOut?: () => void;
}

export function AuthenticatedShell({
  children,
  navGroups,
  branding,
  brandingHref,
  onSignOut,
}: AuthenticatedShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
  }, []);

  function toggle() {
    setCollapsed((c) => {
      localStorage.setItem("sidebar-collapsed", c ? "0" : "1");
      return !c;
    });
  }

  const sidebar = (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-5">
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              JJCET Alumni
            </p>
            <Link href={brandingHref} className="mt-0.5 block truncate text-lg font-bold text-zinc-950">
              {branding}
            </Link>
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>
      <nav aria-label="Sidebar navigation" className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <SidebarSection key={group.group} heading={group.group} items={group.items} collapsed={collapsed} />
        ))}
      </nav>
      {onSignOut && (
        <div className="space-y-2 border-t border-zinc-200 p-3">
          <Link
            href="/"
            title={collapsed ? "View site" : undefined}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            {!collapsed && "View site"}
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            title={collapsed ? "Sign out" : undefined}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {!collapsed && "Sign out"}
          </button>
        </div>
      )}
    </>
  );

  return (
    <Shell
      sidebar={sidebar}
      mobileDrawer={<MobileDrawer>{sidebar}</MobileDrawer>}
      sidebarCollapsed={collapsed}
    >
      {children}
    </Shell>
  );
}
