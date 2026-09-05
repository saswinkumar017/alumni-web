// Section: EventsHeaderSection
// Rendering: Server
// Data: Props-only (receives heading and description from Feature)
// Interaction: Passive (display only)

import PageHeader from "@/components/ui/page-header";

export interface EventsHeaderSectionProps {
  heading: string;
  description: string;
}

export function EventsHeaderSection({ heading, description }: EventsHeaderSectionProps) {
  return <PageHeader heading={heading} description={description} />;
}
