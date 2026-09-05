export interface TraceSpan {
  name: string;
  startTime: number;
  end: (metadata?: { success?: boolean; duration?: number }) => void;
}

export interface LoggerLike {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
}

export interface Tracer {
  startSpan: (name: string) => TraceSpan;
}

export function createTracer(logger?: LoggerLike): Tracer {
  function startSpan(name: string): TraceSpan {
    const startTime = performance.now();
    return {
      name,
      startTime,
      end(metadata) {
        const duration = metadata?.duration ?? performance.now() - startTime;
        logger?.info(`[Trace] ${name}`, { duration, ...metadata });
      },
    };
  }
  return { startSpan };
}

export const defaultTracer = createTracer();
