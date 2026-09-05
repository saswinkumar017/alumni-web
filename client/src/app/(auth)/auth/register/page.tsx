import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create an Account",
  description: "Join the JJCET Alumni network.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return <RegisterForm />;
}
