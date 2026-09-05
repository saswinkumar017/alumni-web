// Component: MessageButton
// Rendering: Client
// Data: Props-only
// Interaction: Reactive

import Button from "@/components/ui/button";

export interface MessageButtonProps {
  profileId: string;
  onMessage?: (id: string) => void;
}

export default function MessageButton({ profileId, onMessage }: MessageButtonProps) {
  return (
    <Button variant="secondary" onClick={() => onMessage?.(profileId)}>
      Message
    </Button>
  );
}
