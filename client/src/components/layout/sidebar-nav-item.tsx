/**
 * SidebarNavItem renders a navigation link with active state detection.
 *
 * @alpha Used indirectly through AuthenticatedShell. Active pattern matching via regex.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
  href: string;
  label: string;
  activePattern: string;
  onClick?: () => void;
}

export function SidebarNavItem({ href, label, activePattern, onClick }: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = new RegExp(activePattern).test(pathname);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-brand-tint-strong text-brand-navy"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
      )}
    >
      {label}
    </Link>
  );
}
