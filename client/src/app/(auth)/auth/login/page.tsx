import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your JJCET Alumni account.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginForm />;
}
