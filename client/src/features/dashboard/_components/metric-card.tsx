// Component: MetricCard
// Rendering: Server
// Data: Props-only
// Interaction: Passive

import Card from "@/components/ui/card";

export interface MetricCardProps {
  label: string;
  value: number | string;
  trend?: "up" | "down" | "neutral";
}

const trendIndicators: Record<string, string> = {
  up: "\u2191",
  down: "\u2193",
  neutral: "\u2192",
};

export default function MetricCard({ label, value, trend }: MetricCardProps) {
  return (
    <Card>
      <p className="text-sm text-zinc-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
      {trend && (
        <p className="mt-1 text-sm text-zinc-500">{trendIndicators[trend]}</p>
      )}
    </Card>
  );
}
