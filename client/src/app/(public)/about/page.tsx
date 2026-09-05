import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about the JJCET Alumni Association.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900">About JJCET Alumni Association</h1>

      <section className="mt-8">
        <h2 className="text-2xl font-bold text-zinc-900">Our Mission</h2>
        <p className="mt-3 text-zinc-600 leading-relaxed">
          The JJCET Alumni Association bridges the gap between past and present students of JJCET,
          fostering lifelong connections, professional growth, and community development. We aim to
          create a vibrant network where alumni can reconnect, collaborate, and contribute to the
          growth of their alma mater.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-bold text-zinc-900">Our History</h2>
        <p className="mt-3 text-zinc-600 leading-relaxed">
          Founded with the vision of uniting JJCET graduates across generations, the Alumni Association
          has grown into a thriving community spanning multiple departments and batch years. From
          our first reunion to the digital platform we use today, we have continuously evolved to
          serve our alumni better.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-bold text-zinc-900">What We Do</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {[
            { title: "Reunions & Events", desc: "Organize annual reunions, department meetups, and professional networking events." },
            { title: "Career Support", desc: "Connect alumni for mentorship, job referrals, and professional development opportunities." },
            { title: "Community Building", desc: "Create batch-wise and department-wise communities for ongoing engagement." },
            { title: "Giving Back", desc: "Enable donations and contributions toward scholarships, infrastructure, and student development." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-zinc-200 bg-white p-5">
              <h3 className="font-semibold text-zinc-900">{item.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-bold text-zinc-900">Contact</h2>
        <p className="mt-3 text-zinc-600">
          JJCET Alumni Association<br />
          Jai Jagathguru Annamalaiyar College of Engineering & Technology<br />
          Namakkal, Tamil Nadu, India<br />
          Email: alumni@jjcet.ac.in
        </p>
      </section>
    </div>
  );
}
