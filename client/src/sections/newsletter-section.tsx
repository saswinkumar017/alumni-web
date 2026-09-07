"use client";

import { useState } from "react";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Join our newsletter to stay updated
        </h2>
        {sent ? (
          <p className="mt-4 max-w-md rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Thank you! You&rsquo;re subscribed with {email}.
          </p>
        ) : (
          <form
            className="mt-4 flex max-w-md gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) setSent(true);
            }}
          >
            <label htmlFor="home-newsletter-email" className="sr-only">
              Your Email
            </label>
            <input
              id="home-newsletter-email"
              type="email"
              required
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
