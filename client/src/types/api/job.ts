import { z } from "zod/v3";

export const JobDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  description: z.string(),
  type: z.enum(["full-time", "part-time", "contract", "internship"]),
  postedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type JobDto = z.infer<typeof JobDtoSchema>;

export const CreateJobRequestSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["full-time", "part-time", "contract", "internship"]),
});

export type CreateJobRequest = z.infer<typeof CreateJobRequestSchema>;

export const UpdateJobRequestSchema = z.object({
  title: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(["full-time", "part-time", "contract", "internship"]).optional(),
});

export type UpdateJobRequest = z.infer<typeof UpdateJobRequestSchema>;
