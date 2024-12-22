import { Skeleton } from "@/components/ui/skeleton";

export const SongSkeleton = () => (
  <div className="flex items-center justify-between rounded-lg border p-2 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-muted rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <div className="flex items-center gap-4">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="w-8 h-8 rounded-full" />
    </div>
  </div>
);