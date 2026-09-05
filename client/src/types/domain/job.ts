import { z } from "zod/v3";
import type { JobId } from "./branded";
import type { Timestamped } from "./metadata";

export type JobType = "full-time" | "part-time" | "contract" | "internship";

export const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  description: z.string(),
  type: z.enum(["full-time", "part-time", "contract", "internship"]),
  postedAt: z.string(),
});

export type Job = z.infer<typeof JobSchema> & Timestamped & { readonly id: JobId };
