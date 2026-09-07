import type { Metadata } from "next";
import { FeedbackForm } from "./feedback-form";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Share your feedback with the JJCET Alumni Network.",
};

export default function FeedbackPage() {
  return (
    <>
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-zinc-900">Feedback</h1>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <FeedbackForm />
      </section>
    </>
  );
}
