import type { UserSettings } from "@/types";
import type { ServiceResult } from "@/lib/services";
import { executeWorkflow, createServiceError, successResult, failureResult } from "@/lib/services";
import type { SettingsServiceContext } from "./settings-service.types";

export async function getSettings(
  userId: string,
  signal: AbortSignal | undefined,
  context: SettingsServiceContext,
): Promise<ServiceResult<UserSettings>> {
  return executeWorkflow<string, UserSettings>(
    userId,
    {
      async execute(id) {
        const result = await context.settingsRepo.getSettings(id, signal);
        if (!result.success) return failureResult(createServiceError("NOT_FOUND", result.error.message));
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function updateSettings(
  userId: string,
  data: Partial<UserSettings>,
  context: SettingsServiceContext,
): Promise<ServiceResult<UserSettings>> {
  return executeWorkflow<{ userId: string; data: Partial<UserSettings> }, UserSettings>(
    { userId, data },
    {
      async execute(input) {
        const result = await context.settingsRepo.updateSettings(input.userId, input.data);
        if (!result.success) return failureResult(createServiceError("VALIDATION_ERROR", result.error.message));
        return successResult(result.data);
      },
    },
    context,
  );
}