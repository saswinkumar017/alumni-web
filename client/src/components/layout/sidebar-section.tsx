import type { NavItem } from "@/config/navigation";
import { SidebarNavItem } from "./sidebar-nav-item";

/**
 * SidebarSection renders a named group of navigation items.
 *
 * @alpha Used indirectly through AuthenticatedShell. Composes SidebarNavItem.
 */
interface SidebarSectionProps {
  heading?: string;
  items: NavItem[];
  collapsed?: boolean;
  onNavClick?: () => void;
}

export function SidebarSection({ heading, items, collapsed, onNavClick }: SidebarSectionProps) {
  return (
    <div className="pb-2">
      {heading && !collapsed && (
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {heading}
        </p>
      )}
      {heading && collapsed && (
        <div aria-hidden className="mx-2 mb-1 border-t border-zinc-200" />
      )}
      <div className="space-y-0.5">
        {items.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            activePattern={item.activePattern}
            collapsed={collapsed}
            onClick={onNavClick}
          />
        ))}
      </div>
    </div>
  );
}
