import { SkeletonBlock, SkeletonCard } from "@/components/skeletons";

export default function AlumniLoading() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-8 w-1/4" />
      <div className="grid gap-6 sm:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard />
    </div>
  );
}
