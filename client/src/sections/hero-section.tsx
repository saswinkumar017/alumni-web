import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-zinc-950 via-zinc-900 to-brand-navy px-4 py-24 sm:px-6 lg:px-8">      <div className="mx-auto max-w-7xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-tint">
          JJCET Alumni Association
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Where JJCET Legends Stay Connected
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 sm:text-xl">
          Connecting alumni, fostering networks, and building community for
          generations to come.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/directory"
            className="rounded-full bg-white px-8 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-100"
          >
            Find Alumni
          </Link>
          <Link
            href="/auth/register"
            className="rounded-full border border-zinc-500 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Join Network
          </Link>
        </div>
      </div>
    </section>
  );
}
