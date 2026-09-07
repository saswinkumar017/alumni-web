const VIDEOS = [
  {
    title: "Installation Ceremony of JJCET Alumni Association Team 2025",
    href: "https://www.youtube.com/watch?v=prXeWnESg70",
  },
  {
    title: "VC Sir Speech - Actor SIVA Function",
    href: "https://www.youtube.com/watch?v=G3Kb28UQuaU",
  },
];

export function AlumniMeetSection() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Alumni Meet
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {VIDEOS.map((v) => (
            <a
              key={v.href}
              href={v.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-zinc-200 bg-white p-6 hover:bg-zinc-50"
            >
              <h3 className="font-semibold text-zinc-900">{v.title}</h3>
              <p className="mt-2 text-sm text-zinc-500">
                JJ College of Engineering and Technology — Watch on YouTube
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
