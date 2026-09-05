import type { Metadata } from "next";
import { AlumniSettings } from "@/features/settings";
import { requireAuth } from "@/lib/data/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings.",
  robots: { index: false, follow: false },
};

export default async function AlumniSettingsPage() {
  const user = await requireAuth();

  return <AlumniSettings user={user} />;
}
