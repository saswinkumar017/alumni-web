import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using the JJCET Alumni Association website and services.",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
        Terms of Service
      </h1>
      <div className="mt-6 space-y-4 text-zinc-600">
        <p>By using this website, you agree to these terms and conditions.</p>
      </div>
    </article>
  );
}
