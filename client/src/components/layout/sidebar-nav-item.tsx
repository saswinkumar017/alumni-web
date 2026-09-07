/**
 * SidebarNavItem renders a navigation link with active state detection.
 *
 * @alpha Used indirectly through AuthenticatedShell. Active pattern matching via regex.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  FileCheck,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Megaphone,
  ScrollText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Array<[RegExp, LucideIcon]> = [
  [/dashboard|developer$/, LayoutDashboard],
  [/alumni/, GraduationCap],
  [/requests|connection/, Inbox],
  [/users|members/, Users],
  [/announcement/, Megaphone],
  [/report/, BarChart3],
  [/audit/, ScrollText],
  [/message/, Bell],
  [/setting|config|policies|maintenance/, Settings],
  [/approval|request/, FileCheck],
];

function iconFor(href: string): LucideIcon {
  return ICONS.find(([re]) => re.test(href))?.[1] ?? LayoutDashboard;
}

interface SidebarNavItemProps {
  href: string;
  label: string;
  activePattern: string;
  collapsed?: boolean;
  onClick?: () => void;
}

export function SidebarNavItem({ href, label, activePattern, collapsed, onClick }: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = new RegExp(activePattern).test(pathname);
  const Icon = iconFor(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={label}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-brand-tint-strong text-brand-navy"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
