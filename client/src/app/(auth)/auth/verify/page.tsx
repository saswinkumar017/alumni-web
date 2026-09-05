import type { Metadata } from "next";
import { VerifyEmail } from "@/features/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your JJCET Alumni email address.",
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  return <VerifyEmail />;
}
