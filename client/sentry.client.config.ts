import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || "development",
  tracesSampleRate: process.env.SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,
  debug: process.env.SENTRY_ENVIRONMENT === "development",
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
});
