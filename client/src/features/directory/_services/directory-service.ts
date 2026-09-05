import type { AlumniProfile } from "@/types";
import type { ServiceResult } from "@/lib/services";
import { executeWorkflow, createServiceError, successResult, failureResult } from "@/lib/services";
import type { DirectoryServiceContext, DirectoryListInput } from "./directory-service.types";

export async function getAlumniDirectory(
  input: DirectoryListInput,
  context: DirectoryServiceContext,
): Promise<ServiceResult<readonly AlumniProfile[]>> {
  return executeWorkflow<DirectoryListInput, readonly AlumniProfile[]>(
    input,
    {
      async execute(params) {
        const result = await context.directoryRepo.getAlumniDirectory(params);
        if (!result.success) {
          return failureResult(createServiceError("NOT_FOUND", result.error.message));
        }
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function getAlumniProfile(
  slug: string,
  signal: AbortSignal | undefined,
  context: DirectoryServiceContext,
): Promise<ServiceResult<AlumniProfile>> {
  return executeWorkflow<string, AlumniProfile>(
    slug,
    {
      async execute(id) {
        const result = await context.directoryRepo.getAlumniProfile(id, signal);
        if (!result.success) {
          return failureResult(createServiceError("NOT_FOUND", result.error.message));
        }
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function searchAlumni(
  query: string,
  signal: AbortSignal | undefined,
  context: DirectoryServiceContext,
): Promise<ServiceResult<readonly AlumniProfile[]>> {
  return executeWorkflow<string, readonly AlumniProfile[]>(
    query,
    {
      async execute(q) {
        const result = await context.directoryRepo.searchAlumni(q, signal);
        if (!result.success) {
          return failureResult(createServiceError("NOT_FOUND", result.error.message));
        }
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function updateProfile(
  userId: string,
  data: Partial<AlumniProfile>,
  context: DirectoryServiceContext,
): Promise<ServiceResult<AlumniProfile>> {
  return executeWorkflow<{ userId: string; data: Partial<AlumniProfile> }, AlumniProfile>(
    { userId, data },
    {
      async execute(input) {
        const result = await context.directoryRepo.updateProfile(input.userId, input.data);
        if (!result.success) {
          return failureResult(createServiceError("VALIDATION_ERROR", result.error.message));
        }
        return successResult(result.data);
      },
    },
    context,
  );
}