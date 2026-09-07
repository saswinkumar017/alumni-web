import Link from "next/link";

const NEWS = [
  {
    title: "MSME IDEA HACKATHON 6.0 on 27.08.2026",
    date: "August 27, 2026",
  },
  {
    title: "Alumni Interaction Programme on Emerging Trends in the IT Sector on 22.08.2026",
    date: "August 22, 2026",
  },
  {
    title: "Alumni Interaction Program for Career Guidance for Higher Studies Abroad -14.08.2026",
    date: "August 14, 2026",
  },
  {
    title: "JJCET ECE 2016 Batch Alumni Reunion on 15.08.2026",
    date: "August 15, 2026",
  },
];

export function EventsSection() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Latest News & Events
        </h2>
        <p className="mt-4 max-w-3xl text-zinc-600">
          Discover the latest updates and upcoming events from the JJCET
          Alumni Network. Stay connected with what&rsquo;s happening in
          our community, from inspiring news to exciting gatherings and
          professional opportunities
        </p>
        <Link
          href="/events"
          className="mt-4 inline-block text-sm font-medium text-zinc-900 underline"
        >
          View Events
        </Link>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {NEWS.map((n) => (
            <article
              key={n.title}
              className="rounded-xl border border-zinc-200 bg-white p-6"
            >
              <h3 className="font-semibold text-zinc-900">{n.title}</h3>
              <p className="mt-2 text-sm text-zinc-500">{n.date}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
