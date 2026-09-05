import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommunityDetail } from "@/features/community";
import { requireAuth } from "@/lib/data/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community Detail",
  description: "Community details and discussions.",
  robots: { index: false, follow: false },
};

export default async function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (isNaN(id)) notFound();
  return <CommunityDetail communityId={id} />;
}
