import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your JJCET Alumni account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
