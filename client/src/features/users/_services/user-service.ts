import type { User } from "@/types";
import type { ServiceResult } from "@/lib/services";
import { executeWorkflow, createServiceError, successResult, failureResult } from "@/lib/services";
import type { UserServiceContext } from "./user-service.types";

export async function getUsers(
  signal: AbortSignal | undefined,
  context: UserServiceContext,
): Promise<ServiceResult<readonly User[]>> {
  return executeWorkflow<void, readonly User[]>(
    undefined,
    {
      async execute() {
        const result = await context.usersRepo.getUsers(signal);
        if (!result.success) return failureResult(createServiceError("NOT_FOUND", result.error.message));
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function getUser(
  id: string,
  signal: AbortSignal | undefined,
  context: UserServiceContext,
): Promise<ServiceResult<User>> {
  return executeWorkflow<string, User>(
    id,
    {
      async execute(userId) {
        const result = await context.usersRepo.getUser(userId, signal);
        if (!result.success) return failureResult(createServiceError("NOT_FOUND", result.error.message));
        return successResult(result.data);
      },
    },
    context,
  );
}