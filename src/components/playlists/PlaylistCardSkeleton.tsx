import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PlaylistCardSkeleton() {
  return (
    <Card className="group overflow-hidden w-[200px] shadow-md bg-card/50 backdrop-blur-sm">
      <CardHeader className="relative aspect-square p-0">
        <Skeleton className="h-[200px] w-[200px]" />
      </CardHeader>
      <CardContent className="p-4">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </CardContent>
    </Card>
  );
}
