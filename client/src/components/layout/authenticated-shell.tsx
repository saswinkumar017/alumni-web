"use client";

import Link from "next/link";
import type { NavGroup } from "@/config/navigation";
import { MobileDrawer } from "./mobile-drawer";
import { Shell } from "./shell";
import { SidebarSection } from "./sidebar-section";
import { Topbar } from "./topbar";

interface AuthenticatedShellProps {
  children: React.ReactNode;
  navGroups: NavGroup[];
  title: string;
  branding: string;
  brandingHref: string;
  onSignOut?: () => void;
}

export function AuthenticatedShell({
  children,
  navGroups,
  title,
  branding,
  brandingHref,
  onSignOut,
}: AuthenticatedShellProps) {
  const sidebar = (
    <>
      <div className="flex h-16 items-center border-b border-zinc-200 px-6">
        <Link href={brandingHref} className="text-lg font-bold text-zinc-950">
          {branding}
        </Link>
      </div>
      <nav aria-label="Sidebar navigation" className="flex-1 space-y-1 overflow-y-auto p-4">
        {navGroups.map((group) => (
          <SidebarSection key={group.group} heading={group.group} items={group.items} />
        ))}
      </nav>
    </>
  );

  const topbarActions = (
    <>
      <Link
        href="/"
        className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
      >
        Home
      </Link>
      {onSignOut && (
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
        >
          Sign out
        </button>
        )}
    </>
  );

  return (
    <Shell
      topbar={<Topbar title={title} actions={topbarActions} />}
      sidebar={sidebar}
      mobileDrawer={<MobileDrawer>{sidebar}</MobileDrawer>}
    >
      {children}
    </Shell>
  );
}
