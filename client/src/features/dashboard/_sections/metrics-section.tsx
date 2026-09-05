// Section: MetricsSection
// Rendering: Server
// Data: Props-only (receives metrics from Feature)
// Interaction: Passive (display only)

import SectionHeader from "@/components/ui/section-header";
import MetricCard from "../_components/metric-card";

export interface MetricsSectionProps {
  metrics: {
    label: string;
    value: number | string;
    trend?: "up" | "down" | "neutral";
  }[];
}

const SECTION_TITLE = "System Metrics";

export function MetricsSection({ metrics }: MetricsSectionProps) {
  if (metrics.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="metrics-heading" className="mt-8">
      <SectionHeader title={SECTION_TITLE} id="metrics-heading" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            trend={metric.trend}
          />
        ))}
      </div>
    </section>
  );
}
