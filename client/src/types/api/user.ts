import { z } from "zod/v3";

export const UserDtoSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: z.enum(["alumni", "admin", "alumni_lead"]),
  avatar: z.string().nullable().optional(),
  batch: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserDto = z.infer<typeof UserDtoSchema>;

export const CreateUserRequestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["alumni", "admin", "alumni_lead"]),
  password: z.string().min(8),
});

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

export const UpdateUserRequestSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["alumni", "admin", "alumni_lead"]).optional(),
  avatar: z.string().nullable().optional(),
});

export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
