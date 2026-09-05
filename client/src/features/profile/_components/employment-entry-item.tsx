// Component: EmploymentEntryItem
// Rendering: Server
// Data: Props-only
// Interaction: Passive

import Card from "@/components/ui/card";

export interface EmploymentEntryItemProps {
  company: string;
  role: string;
  period: string;
}

export default function EmploymentEntryItem({ company, role, period }: EmploymentEntryItemProps) {
  return (
    <Card>
      <p className="font-medium text-zinc-900">{company}</p>
      <p className="text-sm text-zinc-600">
        {role} &middot; {period}
      </p>
    </Card>
  );
}
