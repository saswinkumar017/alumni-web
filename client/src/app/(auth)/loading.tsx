import { Skeleton, SkeletonBlock } from "@/components/skeletons";

export default function AuthLoading() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Skeleton className="h-6 w-48" />
      <SkeletonBlock className="h-10" />
      <SkeletonBlock className="h-10" />
      <Skeleton className="h-10 w-full rounded-full" />
    </div>
  );
}
