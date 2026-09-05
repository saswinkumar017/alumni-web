import { z } from "zod/v3";

export const EventDtoSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  date: z.string(),
  location: z.string(),
  image: z.string().nullable().optional(),
  category: z.enum(["upcoming", "past"]),
  maxAttendees: z.number().int().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type EventDto = z.infer<typeof EventDtoSchema>;

export const CreateEventRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string(),
  location: z.string().min(1),
  category: z.enum(["upcoming", "past"]),
  maxAttendees: z.number().int().positive().optional(),
});

export type CreateEventRequest = z.infer<typeof CreateEventRequestSchema>;

export const UpdateEventRequestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  date: z.string().optional(),
  location: z.string().min(1).optional(),
  category: z.enum(["upcoming", "past"]).optional(),
  maxAttendees: z.number().int().positive().nullable().optional(),
});

export type UpdateEventRequest = z.infer<typeof UpdateEventRequestSchema>;
