import type { Metadata } from "next";
import { requireAuth } from "@/lib/data/auth";
import { AlumniSettingsPageClient } from "@/features/settings/AlumniSettingsPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings.",
  robots: { index: false, follow: false },
};

export default async function AlumniSettingsPage() {
  const user = await requireAuth();

  return <AlumniSettingsPageClient user={user} />;
}