import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EventDetail, EventDetailSkeleton } from "@/features/events";
import { getEvent, getEvents } from "@/lib/data/events";
import { validateSlug } from "@/lib/route-params";

export const revalidate = 3600;

export async function generateStaticParams() {
  const result = await getEvents();
  if (!result.success) return [];
  return result.data.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const validated = validateSlug(slug);
  if (!validated) notFound();

  const result = await getEvent(validated);
  if (!result.success) notFound();
  const event = result.data;

  return {
    title: event.title,
    description: event.description,
    openGraph: {
      title: event.title,
      description: event.description,
    },
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const validated = validateSlug(slug);
  if (!validated) notFound();

  return (
    <Suspense fallback={<EventDetailSkeleton />}>
      <EventDetail slug={validated} />
    </Suspense>
  );
}
