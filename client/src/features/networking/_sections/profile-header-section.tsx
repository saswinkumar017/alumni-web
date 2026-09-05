// Section: ProfileHeaderSection
// Rendering: Server
// Data: Props-only (receives profile from Feature)
// Interaction: Passive (display only)

import ProfileInfo from "../_components/profile-info";

export interface ProfileHeaderData {
  name: string;
  batch: string;
  department: string;
}

export interface ProfileHeaderSectionProps {
  profile: ProfileHeaderData;
}

export function ProfileHeaderSection({ profile }: ProfileHeaderSectionProps) {
  return (
    <section aria-labelledby="networking-profile-name">
      <ProfileInfo name={profile.name} batch={profile.batch} department={profile.department} />
    </section>
  );
}
