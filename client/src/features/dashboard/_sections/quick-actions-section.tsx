// Section: QuickActionsSection
// Rendering: Server
// Data: Props-only (receives actions from Feature)
// Interaction: Reactive (navigation on click)

import type { ReactNode } from "react";
import SectionHeader from "@/components/ui/section-header";
import QuickActionLink from "../_components/quick-action-link";

export interface QuickAction {
  label: string;
  href: string;
  icon?: ReactNode;
}

export interface QuickActionsSectionProps {
  actions: QuickAction[];
}

const SECTION_TITLE = "Quick Actions";

export function QuickActionsSection({ actions }: QuickActionsSectionProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="quick-actions-heading" className="mt-8">
      <SectionHeader title={SECTION_TITLE} id="quick-actions-heading" />
      <div className="mt-4 flex flex-wrap gap-3">
        {actions.map((action) => (
          <QuickActionLink
            key={action.label}
            label={action.label}
            href={action.href}
            icon={action.icon}
          />
        ))}
      </div>
    </section>
  );
}
