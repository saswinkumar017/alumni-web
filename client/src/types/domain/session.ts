import { z } from "zod/v3";
import type { UserId } from "./branded";

export type UserRole = "alumni" | "admin" | "alumni_lead" | "developer";

export const SessionUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(["alumni", "admin", "alumni_lead", "developer"]),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  batch: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
});

export type SessionUser = z.infer<typeof SessionUserSchema> & { readonly id: UserId };
