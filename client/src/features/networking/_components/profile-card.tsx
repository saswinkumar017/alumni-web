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
      <h3 className="font-semibold text-text-primary">{name}</h3>
      <p className="mt-1 text-sm text-text-muted">
        {batch} &middot; {department}
      </p>
    </Card>
  );
}
