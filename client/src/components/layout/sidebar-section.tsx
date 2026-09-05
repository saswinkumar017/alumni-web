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
  onNavClick?: () => void;
}

export function SidebarSection({ heading, items, onNavClick }: SidebarSectionProps) {
  return (
    <div className="pb-2">
      {heading && (
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {heading}
        </p>
      )}
      <div className="space-y-0.5">
        {items.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            activePattern={item.activePattern}
            onClick={onNavClick}
          />
        ))}
      </div>
    </div>
  );
}
