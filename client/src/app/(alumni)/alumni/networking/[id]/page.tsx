import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { NetworkingProfile, NetworkingProfileSkeleton } from "@/features/networking";
import { getCurrentUser } from "@/lib/data/auth";
import { getAlumniProfileSlug } from "@/lib/data/alumni";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alumni Profile",
  description: "View an alumni profile.",
  robots: { index: false, follow: false },
};

export default async function AlumniNetworkingProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const { id } = await params;
  const validated = getAlumniProfileSlug(id);
  if (!validated) notFound();

  return (
    <Suspense fallback={<NetworkingProfileSkeleton />}>
      <NetworkingProfile id={validated} />
    </Suspense>
  );
}
