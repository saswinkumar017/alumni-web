"use client";

// Section: MessageThreadSection
// Rendering: Client
// Data: Props-only (receives messages and callbacks from Feature)
// Interaction: Active (compose and send)

import EmptyState from "@/components/ui/empty-state";
import SectionHeader from "@/components/ui/section-header";
import ComposeForm from "../_components/compose-form";
import MessageBubble from "../_components/message-bubble";

export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
}

export interface MessageThreadSectionProps {
  messages: Message[];
  onSend?: (content: string) => void;
}

const EMPTY_THREAD_MESSAGE = "Select a conversation to start messaging.";

export function MessageThreadSection({ messages, onSend }: MessageThreadSectionProps) {
  return (
    <section aria-labelledby="message-thread-heading">
      <SectionHeader title="Message Thread" id="message-thread-heading" srOnly />
      {messages.length === 0 ? (
        <EmptyState message={EMPTY_THREAD_MESSAGE} />
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              sender={msg.sender}
              content={msg.content}
              timestamp={msg.timestamp}
            />
          ))}
        </div>
      )}
      <ComposeForm onSend={onSend} />
    </section>
  );
}
