"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // biome-ignore lint/suspicious/noConsole: error logging is intentional in error boundaries
  console.error("Global error boundary:", error);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-4xl font-bold text-zinc-900">
            Something went wrong
          </h1>
          <p className="mt-4 text-lg text-zinc-600">
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
