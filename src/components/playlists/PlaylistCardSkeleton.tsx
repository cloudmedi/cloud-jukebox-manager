import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ARTWORK_SIZES } from "@/constants/sizes";

export function PlaylistCardSkeleton() {
  const { width, height } = ARTWORK_SIZES.CARD;
  
  return (
    <Card className={`group overflow-hidden w-[${width}px] shadow-md bg-card/50 backdrop-blur-sm`}>
      <CardHeader className="relative aspect-square p-0">
        <Skeleton className={`h-[${height}px] w-[${width}px]`} />
      </CardHeader>
      <CardContent className="p-4">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </CardContent>
    </Card>
  );
}
