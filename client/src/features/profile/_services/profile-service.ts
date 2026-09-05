import type { AlumniProfile, Education, Employment } from "@/types";
import type { ServiceResult } from "@/lib/services";
import { executeWorkflow, createServiceError, successResult, failureResult } from "@/lib/services";
import type { ProfileServiceContext } from "./profile-service.types";

export async function getProfile(
  userId: string,
  signal: AbortSignal | undefined,
  context: ProfileServiceContext,
): Promise<ServiceResult<AlumniProfile>> {
  return executeWorkflow<string, AlumniProfile>(
    userId,
    {
      async execute(id) {
        const result = await context.profileRepo.getProfile(id, signal);
        if (!result.success) return failureResult(createServiceError("NOT_FOUND", result.error.message));
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function updateProfile(
  userId: string,
  data: Partial<AlumniProfile>,
  context: ProfileServiceContext,
): Promise<ServiceResult<AlumniProfile>> {
  return executeWorkflow<{ userId: string; data: Partial<AlumniProfile> }, AlumniProfile>(
    { userId, data },
    {
      async execute(input) {
        const result = await context.profileRepo.updateProfile(input.userId, input.data);
        if (!result.success) return failureResult(createServiceError("VALIDATION_ERROR", result.error.message));
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function updateEducation(
  userId: string,
  education: readonly Education[],
  context: ProfileServiceContext,
): Promise<ServiceResult<readonly Education[]>> {
  return executeWorkflow<{ userId: string; education: readonly Education[] }, readonly Education[]>(
    { userId, education },
    {
      async execute(input) {
        const result = await context.profileRepo.updateEducation(input.userId, input.education);
        if (!result.success) return failureResult(createServiceError("VALIDATION_ERROR", result.error.message));
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function updateEmployment(
  userId: string,
  employment: readonly Employment[],
  context: ProfileServiceContext,
): Promise<ServiceResult<readonly Employment[]>> {
  return executeWorkflow<{ userId: string; employment: readonly Employment[] }, readonly Employment[]>(
    { userId, employment },
    {
      async execute(input) {
        const result = await context.profileRepo.updateEmployment(input.userId, input.employment);
        if (!result.success) return failureResult(createServiceError("VALIDATION_ERROR", result.error.message));
        return successResult(result.data);
      },
    },
    context,
  );
}