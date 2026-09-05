// Section: ResultsSection
// Rendering: Server
// Data: Props-only (receives profiles from Feature)
// Interaction: Passive (display only)

import EmptyState from "@/components/ui/empty-state";
import SectionHeader from "@/components/ui/section-header";
import ProfileCard from "../_components/profile-card";

export interface AlumniBrief {
  id: string;
  name: string;
  batch: string;
  department: string;
}

export interface ResultsSectionProps {
  profiles: AlumniBrief[];
  emptyMessage?: string;
}

export function ResultsSection({ profiles, emptyMessage }: ResultsSectionProps) {
  if (profiles.length === 0) {
    return (
      <section aria-labelledby="results-heading" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Search Results" id="results-heading" srOnly />
        <EmptyState message={emptyMessage ?? "No alumni found."} />
      </section>
    );
  }

  return (
    <section aria-labelledby="results-heading" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeader title="Search Results" id="results-heading" srOnly />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
