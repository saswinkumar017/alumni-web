import { notFound } from "next/navigation";
import { getAlumniProfile } from "@/lib/data/alumni";
import { ProfileActionsSection } from "./_sections/profile-actions-section";
import { ProfileHeaderSection } from "./_sections/profile-header-section";
import { NetworkingListClient } from "./_components/networking-list-client";

export function NetworkingList() {
  return <NetworkingListClient />;
}

export async function NetworkingProfile({ id }: { id: string }) {
  const result = await getAlumniProfile(id);
  if (!result.success) notFound();
  const profile = result.data;

  return (
    <div>
      <ProfileHeaderSection profile={profile} />
      <ProfileActionsSection profileId={id} />
    </div>
  );
}

export function NetworkingProfileSkeleton() {
  return <div className="animate-skeleton h-4 w-48 rounded bg-surface-hover" />;
}
