import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  registerNumber: z
    .string()
    .min(1, "Register number is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const profileCompleteSchema = z.object({
  company: z
    .string()
    .min(1, "Current working company is required")
    .max(200, "Company name is too long"),
  designation: z
    .string()
    .min(1, "Designation is required")
    .max(200, "Designation is too long"),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  profession: z.string().max(200).optional().or(z.literal("")),
  availability: z.enum(["AVAILABLE", "BUSY", "UNAVAILABLE"]),
});

export type ProfileCompleteInput = z.infer<typeof profileCompleteSchema>;
