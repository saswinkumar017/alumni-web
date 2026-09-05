import { SkeletonBlock } from "@/components/skeletons";

export default function LegalLoading() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-10 w-1/2" />
      <SkeletonBlock className="h-4" />
      <SkeletonBlock className="h-4 w-4/5" />
      <SkeletonBlock className="h-4" />
      <SkeletonBlock className="h-4 w-3/4" />
    </div>
  );
}
