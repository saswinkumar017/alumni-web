// Component: EventCard
// Rendering: Server
// Data: Props-only
// Interaction: Passive

import Card from "@/components/ui/card";

export interface EventCardProps {
  id: string;
  title: string;
  date: string;
  description: string;
}

export default function EventCard({ title, date, description }: EventCardProps) {
  return (
    <Card as="article" className="p-6">
      <h3 className="font-semibold text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-500">{date}</p>
      <p className="mt-2 text-sm text-zinc-600">{description}</p>
    </Card>
  );
}
