import type { Metadata } from "next";
import { DonationsPage } from "@/features/donations";
import { requireAuth } from "@/lib/data/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Donations",
  description: "View and manage your donations.",
  robots: { index: false, follow: false },
};

export default async function DonationsRoutePage() {
  await requireAuth();
  return <DonationsPage />;
}
