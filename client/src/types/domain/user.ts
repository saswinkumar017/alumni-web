import { z } from "zod/v3";
import type { UserId } from "./branded";
import type { Timestamped } from "./metadata";

export type UserRole = "alumni" | "admin" | "alumni_lead";

export const UserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  role: z.enum(["alumni", "admin", "alumni_lead"]),
  avatar: z.string().nullable().optional(),
  batch: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type User = z.infer<typeof UserSchema> & Timestamped & { readonly id: UserId };
