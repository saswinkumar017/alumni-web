// Component: ProfileDetails
// Rendering: Server
// Data: Props-only
// Interaction: Passive

import type { DescriptionListItem } from "@/components/ui/description-list";
import { DescriptionList } from "@/components/ui/description-list";

export interface ProfileDetailsProps {
  email?: string;
  phone?: string;
  location?: string | null;
  bio?: string | null;
}

export default function ProfileDetails({ email, phone, location, bio }: ProfileDetailsProps) {
  const hasDetails = email || phone || location || bio;

  if (!hasDetails) return null;

  const items: DescriptionListItem[] = [];
  if (email) items.push({ term: "Email", description: email });
  if (phone) items.push({ term: "Phone", description: phone });
  if (location) items.push({ term: "Location", description: location });

  return (
    <>
      {bio && <p className="mt-2 text-zinc-600">{bio}</p>}
      <DescriptionList items={items} className="mt-4" />
    </>
  );
}
