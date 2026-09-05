import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-6xl font-bold text-zinc-900">404</h1>
        <p className="mt-4 text-zinc-600">
          This administration page does not exist.
        </p>
        <Link
          href="/admin/dashboard"
          className="mt-8 inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700:bg-zinc-200"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
