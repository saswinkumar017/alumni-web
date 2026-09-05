import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-6xl font-bold text-zinc-900">404</h1>
        <p className="mt-4 text-lg text-zinc-600">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
