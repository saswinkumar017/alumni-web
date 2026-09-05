import Link from "next/link";

interface Event {
  id: number;
  title: string;
  date: string;
  month: string;
  description: string;
}

const events: Event[] = [
  {
    id: 1,
    title: "Alumni Meet 2025",
    date: "15",
    month: "Aug",
    description: "Annual alumni gathering at campus",
  },
  {
    id: 2,
    title: "Career Workshop",
    date: "22",
    month: "Aug",
    description: "Resume building and interview tips",
  },
  {
    id: 3,
    title: "Tech Talk Series",
    date: "05",
    month: "Sep",
    description: "Industry experts share insights",
  },
];

export function EventsSection() {
  return (
    <section className="bg-zinc-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Upcoming Events
          </h2>
          <Link
            href="/events"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            View All →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-zinc-200 bg-white p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-zinc-900 text-white">
                  <span className="text-lg font-bold">{event.date}</span>
                  <span className="text-xs">{event.month}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">
                    {event.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    {event.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
