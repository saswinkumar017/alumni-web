import { z } from "zod/v3";

export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const SearchQuerySchema = z.object({
  query: z.string().min(1),
  fields: z.array(z.string()).optional(),
});

export const SortConfigSchema = z.object({
  field: z.string(),
  direction: z.enum(["asc", "desc"]),
});

export const FilterConfigSchema = z.object({
  field: z.string(),
  operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "contains"]),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export function PaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
  });
}

export const ApiErrorSchema = z.object({
  status: z.number(),
  code: z.string(),
  message: z.string(),
  details: z.array(z.string()).optional(),
});
