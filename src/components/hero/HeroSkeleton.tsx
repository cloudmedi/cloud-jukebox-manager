import { Skeleton } from "@/components/ui/skeleton";

export function HeroSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-600/20 via-indigo-500/20 to-blue-500/20 p-12 mb-8">
      <div className="relative z-10 max-w-4xl space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>
    </div>
  );
}
