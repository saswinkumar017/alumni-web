// Section: RecentActivitySection
// Rendering: Server (initial) / Client (interactive)
// Data: Props-only (receives activities from Feature)
// Interaction: Passive (display only)

import EmptyState from "@/components/ui/empty-state";
import SectionHeader from "@/components/ui/section-header";
import ActivityItem from "../_components/activity-item";

export interface RecentActivitySectionProps {
  activities?: { id: string; description: string; timestamp: string }[];
}

const MAX_VISIBLE_ITEMS = 5;
const SECTION_TITLE = "Recent Activity";

export function RecentActivitySection({ activities }: RecentActivitySectionProps) {
  if (!activities || activities.length === 0) {
    return (
      <section aria-labelledby="recent-activity-heading" className="mt-8">
        <SectionHeader title={SECTION_TITLE} id="recent-activity-heading" />
        <EmptyState message="No recent activity." className="mt-2" />
      </section>
    );
  }

  const visible = activities.slice(0, MAX_VISIBLE_ITEMS);

  return (
    <section aria-labelledby="recent-activity-heading" className="mt-8">
      <SectionHeader title={SECTION_TITLE} id="recent-activity-heading" />
      <ul className="mt-4 divide-y divide-zinc-200">
        {visible.map((item) => (
          <ActivityItem key={item.id} description={item.description} timestamp={item.timestamp} />
        ))}
      </ul>
    </section>
  );
}
