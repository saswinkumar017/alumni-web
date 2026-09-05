// Component: ConnectButton
// Rendering: Client
// Data: Props-only
// Interaction: Reactive

import Button from "@/components/ui/button";

export interface ConnectButtonProps {
  profileId: string;
  onConnect?: (id: string) => void;
}

export default function ConnectButton({ profileId, onConnect }: ConnectButtonProps) {
  return <Button onClick={() => onConnect?.(profileId)}>Connect</Button>;
}
