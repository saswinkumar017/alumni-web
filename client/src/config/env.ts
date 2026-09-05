export const env = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "JJCET Alumni",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api",
    timeout: Number(process.env.API_TIMEOUT_MS) || 30000,
  },
  auth: {
    tokenKey: process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || "auth_token",
  },
  sentry: {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
    environment: process.env.SENTRY_ENVIRONMENT || "development",
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
} as const;
