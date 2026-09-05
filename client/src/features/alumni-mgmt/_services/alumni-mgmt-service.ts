import type { AlumniProfile } from "@/types";
import type { ServiceResult } from "@/lib/services";
import { executeWorkflow, createServiceError, successResult, failureResult } from "@/lib/services";
import type { AlumniMgmtServiceContext } from "./alumni-mgmt-service.types";

export async function getAlumni(
  signal: AbortSignal | undefined,
  context: AlumniMgmtServiceContext,
): Promise<ServiceResult<readonly AlumniProfile[]>> {
  return executeWorkflow<void, readonly AlumniProfile[]>(
    undefined,
    {
      async execute() {
        const result = await context.alumniMgmtRepo.getAlumni(signal);
        if (!result.success) return failureResult(createServiceError("NOT_FOUND", result.error.message));
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function getAlumnus(
  id: string,
  signal: AbortSignal | undefined,
  context: AlumniMgmtServiceContext,
): Promise<ServiceResult<AlumniProfile>> {
  return executeWorkflow<string, AlumniProfile>(
    id,
    {
      async execute(userId) {
        const result = await context.alumniMgmtRepo.getAlumnus(userId, signal);
        if (!result.success) return failureResult(createServiceError("NOT_FOUND", result.error.message));
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function approveAlumnus(
  id: string,
  context: AlumniMgmtServiceContext,
): Promise<ServiceResult<AlumniProfile>> {
  return executeWorkflow<string, AlumniProfile>(
    id,
    {
      async execute(userId) {
        const result = await context.alumniMgmtRepo.approveAlumnus(userId);
        if (!result.success) return failureResult(createServiceError("SERVER_ERROR", result.error.message));
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function rejectAlumnus(
  id: string,
  reason: string,
  context: AlumniMgmtServiceContext,
): Promise<ServiceResult<void>> {
  return executeWorkflow<{ id: string; reason: string }, void>(
    { id, reason },
    {
      async execute(input) {
        const result = await context.alumniMgmtRepo.rejectAlumnus(input.id, input.reason);
        if (!result.success) return failureResult(createServiceError("SERVER_ERROR", result.error.message));
        return successResult(undefined);
      },
    },
    context,
  );
}