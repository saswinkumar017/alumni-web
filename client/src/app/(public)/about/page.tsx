import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterSection } from "@/sections/newsletter-section";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About",
  description:
    "Welcome to the JJ College of Engineering and Technology Alumni Network.",
};

const INVOLVED = [
  {
    title: "Attend Events",
    desc: "Join us for alumni meets, reunions, and other events to reconnect with old friends and make new ones.",
  },
  {
    title: "Become a Mentor",
    desc: "Share your knowledge and experience with current students by participating in our mentorship programs",
  },
  {
    title: "Share Your Story",
    desc: "Inspire others by sharing your professional journey and achievements with the alumni community.",
  },
  {
    title: "Contribute",
    desc: "Support the college through donations, volunteering, or collaborating on projects and initiatives.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-zinc-900">About</h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-zinc-900">
          Welcome to the JJ College of Engineering and Technology Alumni
          Network!
        </h2>
        <p className="mt-4 text-zinc-700">
          We at JJCET envision a global network of empowered alumni who
          stay connected with their alma mater and each other. By
          fostering a sense of belonging and shared purpose, we believe
          we can enhance both personal and professional lives while
          advancing the mission of the management.
        </p>
        <p className="mt-3 text-zinc-700">
          We invite you to explore, connect, and engage with your fellow
          alumni as we continue to build a vibrant network that
          celebrates our collective successes.
        </p>

        <div className="mt-6 space-y-3">
          <details className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
            <summary className="cursor-pointer font-semibold text-zinc-900">
              VISION
            </summary>
            <p className="mt-2 text-sm text-zinc-700">
              <strong>RECONNECT, REJOICE and RELIVE</strong>
            </p>
            <p className="mt-1 text-sm text-zinc-700">
              Empowering a global community of alumni to embrace their
              lifelong connection to the College, fostering a culture of
              engagement, leadership, and excellence.
            </p>
          </details>
          <details className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
            <summary className="cursor-pointer font-semibold text-zinc-900">
              MISSION
            </summary>
            <p className="mt-2 text-sm text-zinc-700">
              To maintain and strengthen the bond between our alumni and
              the College — supporting graduates as they navigate their
              careers, celebrate achievements and give back to the
              community.
            </p>
          </details>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-zinc-900">Get Involved</h2>
          <p className="mt-2 text-zinc-700">
            As a member of the JJ College of Engineering and Technology
            Alumni Network, you have numerous opportunities to stay
            connected and make a difference
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {INVOLVED.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-zinc-200 bg-white p-5"
              >
                <h3 className="font-semibold text-zinc-900">{item.title}</h3>
                <p className="mt-2 text-sm text-zinc-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <NewsletterSection />
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <p>
          <Link href="/auth/register" className="text-sm font-medium text-zinc-900 underline">
            Register Now
          </Link>
        </p>
      </section>
    </>
  );
}
