import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the JJCET Alumni Association.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Contact Us</h1>
      <p className="mt-4 text-lg text-zinc-600">Get in touch with the JJCET Alumni Association.</p>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Reach Us</h2>
          <div className="mt-4 space-y-4 text-sm text-zinc-600">
            <div>
              <p className="font-medium text-zinc-900">Address</p>
              <p>Jai Jagathguru Annamalaiyar College of Engineering & Technology<br />Namakkal, Tamil Nadu 637501, India</p>
            </div>
            <div>
              <p className="font-medium text-zinc-900">Email</p>
              <p>alumni@jjcet.ac.in</p>
            </div>
            <div>
              <p className="font-medium text-zinc-900">Phone</p>
              <p>+91 4286 2XX XXX</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-900">Send a Message</h2>
          <form className="mt-4 space-y-4" action="mailto:alumni@jjcet.ac.in" method="post" encType="text/plain">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700">Name</label>
              <input id="name" name="name" required className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">Email</label>
              <input id="email" name="email" type="email" required className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-zinc-700">Subject</label>
              <input id="subject" name="subject" required className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-zinc-700">Message</label>
              <textarea id="message" name="message" rows={4} required className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
            </div>
            <button type="submit" className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">Send Message</button>
          </form>
        </div>
      </div>
    </div>
  );
}
