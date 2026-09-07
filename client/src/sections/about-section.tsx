import Link from "next/link";

export function AboutSection() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
          About Us
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Alumni Community
        </h2>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-600">
          The core purpose of the Alumni Association is to maintain and
          strengthen the bond between our alumni and the College. We are
          committed to supporting our graduates as they navigate their
          careers, celebrate their achievements and give back to the
          community that helped shape their futures.
        </p>
        <Link
          href="/about"
          className="mt-6 inline-block rounded-full border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          More About Us
        </Link>
      </div>
    </section>
  );
}
