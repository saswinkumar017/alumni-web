import { z } from "zod/v3";
import type { EventId } from "./branded";
import type { Timestamped } from "./metadata";

export type EventCategory = "upcoming" | "past";

export const EventSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  date: z.string(),
  location: z.string(),
  image: z.string().nullable().optional(),
  category: z.enum(["upcoming", "past"]),
  maxAttendees: z.number().int().nullable().optional(),
});

export type Event = z.infer<typeof EventSchema> & Timestamped & { readonly id: EventId };
