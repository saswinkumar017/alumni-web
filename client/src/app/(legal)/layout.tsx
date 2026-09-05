import Link from "next/link";

export default function LegalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6 lg:px-8">{children}</main>
      <footer className="border-t border-zinc-200 py-8 text-center">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-700:text-zinc-300"
        >
          &larr; Back to home
        </Link>
      </footer>
    </div>
  );
}
