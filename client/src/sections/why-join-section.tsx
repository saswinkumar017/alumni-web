import Link from "next/link";

const CARDS = [
  {
    title: "Strengthen Your Network",
    desc: "Build lasting connections with fellow alumni and industry leaders.",
  },
  {
    title: "Access Career Resources",
    desc: "Unlock tools and opportunities to advance your professional journey.",
  },
  {
    title: "Stay Informed and Engaged",
    desc: "Keep up-to-date with the latest news, events, and developments in your field.",
  },
  {
    title: "Participate in Exclusive Events",
    desc: "Join unique gatherings and experiences designed just for our alumni community.",
  },
  {
    title: "Give Back and Make an Impact",
    desc: "Contribute your time and expertise to support future generations.",
  },
  {
    title: "Enhance Your Personal Growth",
    desc: "Access to the college library, research publications, and more",
  },
];

export function WhyJoinSection() {
  return (
    <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Connect, Engage, and Thrive
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Why Join Our Alumni Community?
        </h2>
        <p className="mt-4 max-w-3xl text-zinc-600">
          Joining the JJCET Alumni Portal opens up a world of
          opportunities and benefits that enhance your connection with
          your alma mater and fellow graduates. Here&rsquo;s why you
          should become an active member of our vibrant alumni network:
        </p>
        <p className="mt-3 max-w-3xl text-zinc-600">
          Join us on the JJCET Alumni Portal and be part of a thriving
          network that continues to grow and evolve. Your connection
          with JJCET doesn&rsquo;t end at graduation; it&rsquo;s a
          lifelong journey of opportunities, growth, and mutual
          friendship. We look forward to welcoming you back and seeing
          the incredible ways you&rsquo;ll contribute to our alumni
          community!
        </p>
        <Link
          href="/auth/register"
          className="mt-6 inline-block rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Join Community
        </Link>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => (
            <div
              key={c.title}
              className="rounded-xl border border-zinc-200 bg-white p-6"
            >
              <h3 className="font-semibold text-zinc-900">{c.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
