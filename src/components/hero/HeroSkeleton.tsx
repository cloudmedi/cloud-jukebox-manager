import { Skeleton } from "@/components/ui/skeleton";
import { ARTWORK_SIZES } from "@/constants/sizes";

export function HeroSkeleton() {
  const { width, height } = ARTWORK_SIZES.HERO;
  
  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-600/20 via-indigo-500/20 to-blue-500/20 p-12 mb-8">
      <div className="relative z-10 max-w-4xl space-y-6">
        <Skeleton className={`h-12 w-[${width}px]`} />
        <div className="space-y-4">
          <Skeleton className={`h-6 w-[${width * 0.75}px]`} />
          <Skeleton className={`h-6 w-[${width * 0.5}px]`} />
        </div>
      </div>
    </div>
  );
}
