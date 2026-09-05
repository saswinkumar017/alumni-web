// Section: ResultsSection
// Rendering: Server
// Data: Props-only (receives profiles from Feature)
// Interaction: Passive (display)

import EmptyState from "@/components/ui/empty-state";
import SectionHeader from "@/components/ui/section-header";
import ProfileCard from "../_components/profile-card";

export interface AlumniProfileBrief {
  id: string;
  name: string;
  batch: string;
  department: string;
}

export interface ResultsSectionProps {
  profiles: AlumniProfileBrief[];
  emptyMessage?: string;
}

export function ResultsSection({ profiles, emptyMessage }: ResultsSectionProps) {
  if (profiles.length === 0) {
    return (
      <section aria-labelledby="networking-results-heading" className="mt-6">
        <SectionHeader title="Alumni Network" id="networking-results-heading" />
        <EmptyState message={emptyMessage ?? "No alumni found."} className="mt-2" />
      </section>
    );
  }

  return (
    <section aria-labelledby="networking-results-heading" className="mt-6">
      <SectionHeader title="Alumni Network" id="networking-results-heading" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            id={profile.id}
            name={profile.name}
            batch={profile.batch}
            department={profile.department}
          />
        ))}
      </div>
    </section>
  );
}
