// Component: ProfileCard
// Rendering: Server
// Data: Props-only
// Interaction: Passive

import Card from "@/components/ui/card";

export interface ProfileCardProps {
  id: string;
  name: string;
  batch: string;
  department: string;
}

export default function ProfileCard({ name, batch, department }: ProfileCardProps) {
  return (
    <Card as="article">
      <h3 className="font-semibold text-zinc-900">{name}</h3>
      <p className="mt-1 text-sm text-zinc-500">
        {batch} &middot; {department}
      </p>
    </Card>
  );
}
