import pino from "pino";

const level = process.env.LOG_LEVEL || "info";

const transport =
  process.env.NODE_ENV === "development"
    ? pino.transport({
        target: "pino-pretty",
        options: { colorize: true, translateTime: "HH:MM:ss.l" },
      })
    : undefined;

export const logger = pino(
  {
    level,
    browser: { asObject: true },
  },
  transport,
);
