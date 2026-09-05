export async function initErrorMonitoring(): Promise<void> {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT || "development",
      tracesSampleRate: process.env.SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,
      debug: process.env.SENTRY_ENVIRONMENT === "development",
    });
  }
}
