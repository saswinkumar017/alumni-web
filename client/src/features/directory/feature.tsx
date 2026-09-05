import { notFound } from "next/navigation";
import { getAlumniProfile } from "@/lib/data/alumni";
import {
  ProfileDetailsSection,
  ProfileDetailsSectionSkeleton,
} from "./_sections/profile-details-section";
import { ProfileHeaderSection } from "./_sections/profile-header-section";
import { ResultsSection } from "./_sections/results-section";
import { SearchSection } from "./_sections/search-section";

export function DirectoryList() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
        Alumni Directory
      </h1>
      <p className="mt-4 text-lg text-zinc-600">
        Browse and search for alumni by batch, department, or name.
      </p>
      <div className="mt-8">
        <SearchSection />
      </div>
      <div className="mt-6">
        <ResultsSection profiles={[]} />
      </div>
    </div>
  );
}

export async function DirectoryProfile({ slug }: { slug: string }) {
  const result = await getAlumniProfile(slug);
  if (!result.success) notFound();
  const profile = result.data;

  return (
    <div>
      <ProfileHeaderSection profile={profile} />
      <ProfileDetailsSection
        details={{
          location: profile.location,
          bio: profile.bio,
        }}
      />
    </div>
  );
}

export function DirectoryProfileSkeleton() {
  return <ProfileDetailsSectionSkeleton />;
}
