"use client";

// Section: ConversationListSection
// Rendering: Client
// Data: Props-only (receives conversations and callbacks from Feature)
// Interaction: Reactive (conversation selection)

import EmptyState from "@/components/ui/empty-state";
import SectionHeader from "@/components/ui/section-header";
import ConversationItem from "../_components/conversation-item";

export interface Conversation {
  id: string;
  participant: string;
  lastMessage: string;
  unread: boolean;
  timestamp: string;
}

export interface ConversationListSectionProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

const SECTION_TITLE = "Conversations";
const EMPTY_MESSAGE = "No conversations yet.";

export function ConversationListSection({
  conversations,
  selectedId,
  onSelect,
}: ConversationListSectionProps) {
  if (conversations.length === 0) {
    return (
      <section aria-labelledby="conversations-heading">
        <SectionHeader title={SECTION_TITLE} id="conversations-heading" />
        <EmptyState message={EMPTY_MESSAGE} className="mt-2" />
      </section>
    );
  }

  return (
    <section aria-labelledby="conversations-heading">
      <SectionHeader title={SECTION_TITLE} id="conversations-heading" />
      <ul className="mt-4 divide-y divide-zinc-200">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            id={conversation.id}
            participant={conversation.participant}
            lastMessage={conversation.lastMessage}
            unread={conversation.unread}
            timestamp={conversation.timestamp}
            isSelected={selectedId === conversation.id}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </section>
  );
}
