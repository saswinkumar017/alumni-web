import type { AlumniProfile } from "@/types";
import type { ServiceResult } from "@/lib/services";
import { executeWorkflow, createServiceError, successResult, failureResult } from "@/lib/services";
import type { NetworkingServiceContext } from "./networking-service.types";

export async function getNetworkProfiles(
  signal: AbortSignal | undefined,
  context: NetworkingServiceContext,
): Promise<ServiceResult<readonly AlumniProfile[]>> {
  return executeWorkflow<void, readonly AlumniProfile[]>(
    undefined,
    {
      async execute() {
        const result = await context.networkingRepo.getProfiles(signal);
        if (!result.success) return failureResult(createServiceError("NOT_FOUND", result.error.message));
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function getNetworkProfile(
  slug: string,
  signal: AbortSignal | undefined,
  context: NetworkingServiceContext,
): Promise<ServiceResult<AlumniProfile>> {
  return executeWorkflow<string, AlumniProfile>(
    slug,
    {
      async execute(id) {
        const result = await context.networkingRepo.getProfile(id, signal);
        if (!result.success) return failureResult(createServiceError("NOT_FOUND", result.error.message));
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function sendConnectionRequest(
  targetUserId: string,
  context: NetworkingServiceContext,
): Promise<ServiceResult<void>> {
  return executeWorkflow<string, void>(
    targetUserId,
    {
      async execute(id) {
        const result = await context.networkingRepo.sendConnectionRequest(id);
        if (!result.success) return failureResult(createServiceError("CONFLICT", result.error.message));
        return successResult(undefined);
      },
    },
    context,
  );
}