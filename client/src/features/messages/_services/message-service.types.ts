import type { Conversation, Message } from "@/types";
import type { LoggerLike, Tracer } from "@/lib/services";
import type { EventBus } from "@/lib/event-bus";

export interface MessageServiceContext {
  tracer: Tracer;
  messagesRepo: {
    getConversations(userId: string, signal?: AbortSignal): Promise<import("@/lib/data/types").Result<readonly Conversation[]>>;
    getMessages(conversationId: string, signal?: AbortSignal): Promise<import("@/lib/data/types").Result<readonly Message[]>>;
    sendMessage(input: { conversationId?: string; recipientId: string; content: string }): Promise<import("@/lib/data/types").Result<Message>>;
  };
  eventBus: EventBus;
  logger: LoggerLike;
}