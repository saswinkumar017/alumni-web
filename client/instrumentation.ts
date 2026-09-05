export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initErrorMonitoring } = await import("@/config/error-monitoring");
    initErrorMonitoring();
  }
}
