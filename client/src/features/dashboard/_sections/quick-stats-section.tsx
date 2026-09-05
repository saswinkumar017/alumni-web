// Section: QuickStatsSection
// Rendering: Server
// Data: Props-only (receives stats from Feature)
// Interaction: Passive (display only)

import SectionHeader from "@/components/ui/section-header";
import StatCard from "../_components/stat-card";

export interface QuickStatsSectionProps {
  stats?: {
    label: string;
    value: number;
  }[];
}

export function QuickStatsSection({ stats }: QuickStatsSectionProps) {
  if (!stats || stats.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="quick-stats-heading" className="mt-8">
      <SectionHeader title="Quick Statistics" id="quick-stats-heading" srOnly />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>
    </section>
  );
}
