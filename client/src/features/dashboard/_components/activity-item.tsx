// Component: ActivityItem
// Rendering: Server
// Data: Props-only
// Interaction: Passive

export interface ActivityItemProps {
  description: string;
  timestamp: string;
}

export default function ActivityItem({ description, timestamp }: ActivityItemProps) {
  return (
    <li className="py-3">
      <p className="text-sm text-zinc-700">{description}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{timestamp}</p>
    </li>
  );
}
