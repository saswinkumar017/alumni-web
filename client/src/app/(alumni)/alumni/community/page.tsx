import type { Metadata } from "next";
import { CommunityList } from "@/features/community";
import { requireAuth } from "@/lib/data/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community",
  description: "Join and participate in alumni communities.",
  robots: { index: false, follow: false },
};

export default async function CommunityPage() {
  await requireAuth();
  return <CommunityList />;
}
