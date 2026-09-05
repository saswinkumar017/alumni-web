import type { Report } from "@/types";
import type { ServiceResult } from "@/lib/services";
import { executeWorkflow, createServiceError, successResult, failureResult } from "@/lib/services";
import type { ReportServiceContext } from "./report-service.types";

export async function getReports(
  signal: AbortSignal | undefined,
  context: ReportServiceContext,
): Promise<ServiceResult<readonly Report[]>> {
  return executeWorkflow<void, readonly Report[]>(
    undefined,
    {
      async execute() {
        const result = await context.reportsRepo.getReports(signal);
        if (!result.success) return failureResult(createServiceError("NOT_FOUND", result.error.message));
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function getReport(
  id: string,
  signal: AbortSignal | undefined,
  context: ReportServiceContext,
): Promise<ServiceResult<Report>> {
  return executeWorkflow<string, Report>(
    id,
    {
      async execute(reportId) {
        const result = await context.reportsRepo.getReport(reportId, signal);
        if (!result.success) return failureResult(createServiceError("NOT_FOUND", result.error.message));
        return successResult(result.data);
      },
    },
    context,
  );
}