import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the JJCET Alumni Network.",
};

const inputCls =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm";
const labelCls = "block text-xs font-medium text-zinc-600";

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-zinc-900">Get In Touch</h1>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Send Us Message</h2>
          <form className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-first" className={labelCls}>First Name</label>
                <input id="contact-first" required placeholder="First Name" className={inputCls} />
              </div>
              <div>
                <label htmlFor="contact-last" className={labelCls}>Last Name</label>
                <input id="contact-last" required placeholder="Last Name" className={inputCls} />
              </div>
            </div>
            <div>
              <label htmlFor="contact-email" className={labelCls}>Email</label>
              <input id="contact-email" type="email" required placeholder="Email" className={inputCls} />
            </div>
            <div>
              <label htmlFor="contact-subject" className={labelCls}>Subject</label>
              <input id="contact-subject" required placeholder="Subject" className={inputCls} />
            </div>
            <div>
              <label htmlFor="contact-message" className={labelCls}>Message</label>
              <textarea id="contact-message" rows={5} required placeholder="Message" className={inputCls} />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white"
            >
              Send Us Message
            </button>
          </form>
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Contact Info</h2>
          <div className="mt-4 space-y-3 text-sm text-zinc-700">
            <p>
              J.J. College of Engineering and Technology, Ammapettai,
              Poolangulathupatti (PO), Tiruchirappalli - 620009.
            </p>
            <p>VANI R T - Manager Alumni Relations</p>
            <p>
              <a href="mailto:alumni@jjcet.ac.in" className="hover:text-zinc-900">
                alumni@jjcet.ac.in
              </a>
            </p>
            <p>
              <a href="tel:+919150411776" className="hover:text-zinc-900">
                +919150411776
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
