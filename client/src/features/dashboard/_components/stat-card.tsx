// Component: StatCard
// Rendering: Server
// Data: Props-only
// Interaction: Passive

import Card from "@/components/ui/card";

export interface StatCardProps {
  label: string;
  value: number;
}

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <Card>
      <p className="text-sm text-zinc-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
    </Card>
  );
}
