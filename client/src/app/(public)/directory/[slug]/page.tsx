import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DirectoryProfile, DirectoryProfileSkeleton } from "@/features/directory";
import { getAlumniDirectory, getAlumniProfile } from "@/lib/data/alumni";
import { validateSlug } from "@/lib/route-params";

export const revalidate = 3600;

export async function generateStaticParams() {
  const result = await getAlumniDirectory();
  if (!result.success) return [];
  return result.data.map((profile) => ({ slug: profile.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const validated = validateSlug(slug);
  if (!validated) notFound();

  const result = await getAlumniProfile(validated);
  if (!result.success) notFound();
  const profile = result.data;

  return {
    title: `${profile.name} — Alumni Profile`,
    description: profile.bio ?? `Alumni profile for ${profile.name}`,
    openGraph: {
      title: `${profile.name} — JJCET Alumni`,
      description: profile.bio ?? `View ${profile.name}'s alumni profile.`,
    },
  };
}

export default async function DirectoryProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const validated = validateSlug(slug);
  if (!validated) notFound();

  return (
    <Suspense fallback={<DirectoryProfileSkeleton />}>
      <DirectoryProfile slug={validated} />
    </Suspense>
  );
}
