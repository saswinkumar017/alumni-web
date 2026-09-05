import { z } from "zod/v3";
import type { UserId } from "./branded";

export const AlumniProfileSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  batch: z.string(),
  department: z.string(),
  bio: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
});

export type AlumniProfile = z.infer<typeof AlumniProfileSchema> & { readonly id: UserId };

export interface Education {
  readonly institution: string;
  readonly degree: string;
  readonly field: string;
  readonly startYear: number;
  readonly endYear?: number;
}

export interface Employment {
  readonly company: string;
  readonly role: string;
  readonly startYear: number;
  readonly endYear?: number;
  readonly description?: string;
}
