// Section: ProfileDetailsSection
// Rendering: Server
// Data: Props-only (receives profile details from Feature)
// Interaction: Passive (display only)

import { SkeletonBlock } from "@/components/skeletons";
import SectionHeader from "@/components/ui/section-header";
import ProfileDetails from "../_components/profile-details";

export interface ProfileDetailsData {
  email?: string;
  phone?: string;
  location?: string | null;
  bio?: string | null;
}

export interface ProfileDetailsSectionProps {
  details: ProfileDetailsData;
}

export function ProfileDetailsSection({ details }: ProfileDetailsSectionProps) {
  const hasDetails = details.email || details.phone || details.location || details.bio;

  if (!hasDetails) {
    return null;
  }

  return (
    <section
      aria-labelledby="profile-details-heading"
      className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8"
    >
      <SectionHeader title="About" id="profile-details-heading" as="h2" className="text-xl" />
      <ProfileDetails
        email={details.email}
        phone={details.phone}
        location={details.location}
        bio={details.bio}
      />
    </section>
  );
}

export function ProfileDetailsSectionSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="h-6 w-16 animate-skeleton rounded bg-zinc-200" />
      <div className="mt-4 space-y-2">
        <SkeletonBlock />
        <div className="h-4 w-3/4 animate-skeleton rounded bg-zinc-200" />
      </div>
    </div>
  );
}
