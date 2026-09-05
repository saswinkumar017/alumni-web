// Component: PendingRequestItem
// Rendering: Client
// Data: Props-only
// Interaction: Reactive

import Button from "@/components/ui/button";

export interface PendingRequestItemProps {
  id: string;
  title: string;
  submittedBy: string;
  submittedAt: string;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export default function PendingRequestItem({
  id,
  title,
  submittedBy,
  submittedAt,
  onApprove,
  onReject,
}: PendingRequestItemProps) {
  return (
    <li className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-zinc-900">{title}</p>
        <p className="text-xs text-zinc-500">
          {submittedBy} &middot; {submittedAt}
        </p>
      </div>
      {(onApprove || onReject) && (
        <div className="flex gap-2">
          {onApprove && (
            <Button variant="success" size="sm" onClick={() => onApprove(id)}>
              Approve
            </Button>
          )}
          {onReject && (
            <Button variant="danger" size="sm" onClick={() => onReject(id)}>
              Reject
            </Button>
          )}
        </div>
      )}
    </li>
  );
}
