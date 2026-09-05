// Component: ConversationItem
// Rendering: Client
// Data: Props-only
// Interaction: Reactive

import { cn } from "@/lib/utils";

export interface ConversationItemProps {
  id: string;
  participant: string;
  lastMessage: string;
  unread: boolean;
  timestamp: string;
  isSelected: boolean;
  onSelect?: (id: string) => void;
}

export default function ConversationItem({
  id,
  participant,
  lastMessage,
  unread,
  timestamp,
  isSelected,
  onSelect,
}: ConversationItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect?.(id)}
        className={cn(
          "w-full px-4 py-3 text-left transition-colors hover:bg-zinc-50:bg-zinc-800/50",
          isSelected ? "bg-zinc-100" : "",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-zinc-900">{participant}</span>
          <span className="text-xs text-zinc-500">{timestamp}</span>
        </div>
        <p
          className={cn(
            "mt-1 truncate text-sm",
            unread
              ? "font-medium text-zinc-900"
              : "text-zinc-600",
          )}
        >
          {lastMessage}
        </p>
      </button>
    </li>
  );
}
