import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-zinc-950 via-zinc-900 to-brand-navy px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Welcome to the Alumni Portal of JJCET!
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-300 sm:text-xl">
          At JJCET, our commitment to fostering a vibrant and supportive
          community extends far beyond graduation. The Alumni Portal is
          designed to be a central hub where our distinguished graduates
          can connect, collaborate, and continue to grow together.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/auth/register"
            className="rounded-full bg-white px-8 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-100"
          >
            Register Now
          </Link>
        </div>
      </div>
    </section>
  );
}
