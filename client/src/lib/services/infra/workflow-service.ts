import type { AppEvent } from "@/types";
import type { EventBus } from "@/lib/event-bus";
import type { LoggerLike, Tracer } from "./tracer-service";
import { type ServiceResult, type ServiceErrorCode, createServiceError, failureResult } from "./service-error";

export interface WorkflowContext {
  tracer: Tracer;
  logger: LoggerLike;
  eventBus?: EventBus;
}

export interface WorkflowStep<TInput, TOutput> {
  validate?: (input: TInput) => void;
  authorize?: (input: TInput) => void;
  execute: (input: TInput) => Promise<ServiceResult<TOutput>>;
  invalidate?: () => void;
  emit?: readonly { event: AppEvent["type"]; payload: (output: TOutput) => AppEvent["payload"] }[];
  notify?: (output: TOutput) => void;
}

export async function executeWorkflow<TInput, TOutput>(
  input: TInput,
  steps: WorkflowStep<TInput, TOutput>,
  context: WorkflowContext,
): Promise<ServiceResult<TOutput>> {
  const { tracer, logger } = context;
  const span = tracer.startSpan(steps.execute.name || "workflow");

  try {
    const result = await steps.execute(input);

    if (steps.invalidate) {
      try {
        steps.invalidate();
      } catch (e) {
        logger.warn("Cache invalidation failed", e);
      }
    }

    if (result.success && steps.emit && context.eventBus) {
      for (const evt of steps.emit) {
        try {
          context.eventBus.emit(evt.event, evt.payload(result.data));
        } catch (e) {
          logger.warn(`Event emission failed: ${evt.event}`, e);
        }
      }
    }

    if (result.success && steps.notify) {
      try {
        steps.notify(result.data);
      } catch (e) {
        logger.warn("Notification failed", e);
      }
    }

    span.end({ success: result.success });
    return result;
  } catch (error) {
    logger.error(`Workflow failed: ${steps.execute.name}`, error);
    span.end({ success: false });
    return failureResult(
      createServiceError("UNEXPECTED_ERROR", "An unexpected error occurred", undefined, undefined, error),
    );
  }
}

export function createWorkflowError(
  code: ServiceErrorCode,
  message: string,
  detail?: string,
  field?: string,
  cause?: unknown,
) {
  return failureResult(createServiceError(code, message, detail, field, cause));
}
