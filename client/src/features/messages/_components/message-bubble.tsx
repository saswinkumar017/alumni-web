// Component: MessageBubble
// Rendering: Server
// Data: Props-only
// Interaction: Passive

export interface MessageBubbleProps {
  sender: string;
  content: string;
  timestamp: string;
}

export default function MessageBubble({ sender, content, timestamp }: MessageBubbleProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-zinc-900">{sender}</span>
        <span className="text-xs text-zinc-500">{timestamp}</span>
      </div>
      <p className="mt-1 text-sm text-zinc-600">{content}</p>
    </div>
  );
}
