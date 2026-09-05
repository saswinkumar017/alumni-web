import Link from "next/link";

export function CTASection() {
  return (
    <section className="bg-zinc-950 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to Connect?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
          Join our growing network of JJCET alumni. Stay connected, explore
          opportunities, and contribute to the community.
        </p>
        <div className="mt-8">
          <Link
            href="/auth/register"
            className="inline-flex items-center rounded-full bg-accent-solid px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-solid-hover"
          >
            Join Now
          </Link>
        </div>
      </div>
    </section>
  );
}
