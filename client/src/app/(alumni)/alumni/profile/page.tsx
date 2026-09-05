import type { Metadata } from "next";
import { ProfileManager } from "@/features/profile";
import { requireAuth } from "@/lib/data/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your alumni profile.",
  robots: { index: false, follow: false },
};

export default async function AlumniProfilePage() {
  const user = await requireAuth();

  return <ProfileManager user={user} />;
}
