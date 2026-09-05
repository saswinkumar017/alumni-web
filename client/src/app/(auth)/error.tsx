"use client";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // biome-ignore lint/suspicious/noConsole: error logging is intentional in error boundaries
  console.error("Auth route error:", error);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <h2 className="text-2xl font-bold text-zinc-900">Authentication error</h2>
        <p className="mt-2 text-zinc-600">
          Something went wrong. Please try signing in again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700:bg-zinc-200"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
