import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for the JJCET Alumni Association website.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
        Privacy Policy
      </h1>
      <div className="mt-6 space-y-4 text-zinc-600">
        <p>
          Your privacy is important to us. This policy outlines how we collect, use, and protect
          your personal information.
        </p>
      </div>
    </article>
  );
}
