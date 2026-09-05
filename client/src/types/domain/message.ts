import { z } from "zod/v3";
import type { MessageId, ConversationId, UserId } from "./branded";
import type { Timestamped } from "./metadata";

export const MessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  content: z.string(),
  readAt: z.string().nullable().optional(),
});

export type Message = z.infer<typeof MessageSchema> & Timestamped & { readonly id: MessageId; readonly conversationId: ConversationId; readonly senderId: UserId };

export interface Conversation {
  readonly id: ConversationId;
  readonly participants: readonly UserId[];
  readonly lastMessage: Message | null;
  readonly unreadCount: number;
}
