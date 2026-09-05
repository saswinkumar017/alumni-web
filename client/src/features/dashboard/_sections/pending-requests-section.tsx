"use client";

// Section: PendingRequestsSection
// Rendering: Server (initial) / Client (action buttons)
// Data: Props-only (receives requests from Feature)
// Interaction: Reactive (approve/reject callbacks)

import EmptyState from "@/components/ui/empty-state";
import SectionHeader from "@/components/ui/section-header";
import PendingRequestItem from "../_components/pending-request-item";

export interface PendingRequest {
  id: string;
  title: string;
  submittedBy: string;
  submittedAt: string;
}

export interface PendingRequestsSectionProps {
  requests: PendingRequest[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const SECTION_TITLE = "Pending Requests";
const EMPTY_MESSAGE = "No pending requests.";
const MAX_VISIBLE_REQUESTS = 10;

export function PendingRequestsSection({
  requests,
  onApprove,
  onReject,
}: PendingRequestsSectionProps) {
  if (requests.length === 0) {
    return (
      <section aria-labelledby="pending-requests-heading" className="mt-8">
        <SectionHeader title={SECTION_TITLE} id="pending-requests-heading" />
        <EmptyState message={EMPTY_MESSAGE} className="mt-2" />
      </section>
    );
  }

  const visible = requests.slice(0, MAX_VISIBLE_REQUESTS);

  return (
    <section aria-labelledby="pending-requests-heading" className="mt-8">
      <SectionHeader title={SECTION_TITLE} id="pending-requests-heading" />
      <ul className="mt-4 divide-y divide-zinc-200">
        {visible.map((req) => (
          <PendingRequestItem
            key={req.id}
            id={req.id}
            title={req.title}
            submittedBy={req.submittedBy}
            submittedAt={req.submittedAt}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}
      </ul>
    </section>
  );
}
