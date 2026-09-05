// Section: ProfileHeaderSection
// Rendering: Server
// Data: Props-only (receives profile from Feature)
// Interaction: Passive (display only)

import ProfileInfo from "../_components/profile-info";

export interface ProfileData {
  name: string;
  batch: string;
  department: string;
}

export interface ProfileHeaderSectionProps {
  profile: ProfileData;
}

export function ProfileHeaderSection({ profile }: ProfileHeaderSectionProps) {
  return (
    <section
      aria-labelledby="profile-name"
      className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <ProfileInfo name={profile.name} batch={profile.batch} department={profile.department} />
    </section>
  );
}
