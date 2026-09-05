// Component: EducationEntryItem
// Rendering: Server
// Data: Props-only
// Interaction: Passive

import Card from "@/components/ui/card";

export interface EducationEntryItemProps {
  institution: string;
  degree: string;
  year: string;
}

export default function EducationEntryItem({ institution, degree, year }: EducationEntryItemProps) {
  return (
    <Card>
      <p className="font-medium text-zinc-900">{institution}</p>
      <p className="text-sm text-zinc-600">
        {degree} &middot; {year}
      </p>
    </Card>
  );
}
