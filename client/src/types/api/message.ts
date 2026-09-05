import { z } from "zod/v3";

export const MessageDtoSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  content: z.string(),
  readAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type MessageDto = z.infer<typeof MessageDtoSchema>;

export const SendMessageRequestSchema = z.object({
  conversationId: z.string().optional(),
  recipientId: z.string().optional(),
  content: z.string().min(1),
});

export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;
