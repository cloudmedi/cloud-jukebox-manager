import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DeviceTableHeader } from "./DeviceTableHeader";
import { DeviceTableRow } from "./DeviceTableRow";
import { Skeleton } from "@/components/ui/skeleton";

export const DeviceList = () => {
  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) {
        throw new Error("Cihazlar yüklenemedi");
      }
      return response.json();
    },
    refetchInterval: 5000, // 5 saniyede bir yenile
    refetchOnWindowFocus: true,
    staleTime: 0 // Her zaman yeni veri al
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-12rem)] rounded-md border">
      <div className="relative">
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 bg-background">
            <DeviceTableHeader />
          </thead>
          <tbody>
            {devices.map((device) => (
              <DeviceTableRow key={device._id} device={device} />
            ))}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  );
};