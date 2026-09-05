export type LogLevel = "error" | "warn" | "info" | "debug";
let currentLevel: LogLevel = "error";

const LEVELS: Record<LogLevel, number> = { error: 0, warn: 1, info: 2, debug: 3 };

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] <= LEVELS[currentLevel];
}

export const logger = {
  error: (message: string, ...args: unknown[]) => { if (shouldLog("error")) console.error(`[ERROR] ${message}`, ...args); },
  warn: (message: string, ...args: unknown[]) => { if (shouldLog("warn")) console.warn(`[WARN] ${message}`, ...args); },
  info: (message: string, ...args: unknown[]) => { if (shouldLog("info")) console.info(`[INFO] ${message}`, ...args); },
  debug: (message: string, ...args: unknown[]) => { if (shouldLog("debug")) console.debug(`[DEBUG] ${message}`, ...args); },
};