import type { Metadata } from "next";
import { AlumniDashboard } from "@/features/dashboard";
import { requireAuth } from "@/lib/data/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your alumni dashboard.",
  robots: { index: false, follow: false },
};

export default async function AlumniDashboardPage() {
  const user = await requireAuth();

  return <AlumniDashboard user={user} />;
}
