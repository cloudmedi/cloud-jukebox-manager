import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from "react-window-infinite-loader";
import { DeviceTableHeader } from "./DeviceTableHeader";
import { DeviceTableRow } from "./DeviceTableRow";
import { DeviceFilters } from "./DeviceFilters";
import { Device } from "@/services/deviceService";

const LIMIT = 20;

const DeviceList = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "online" | "offline">("all");
  const { toast } = useToast();

  const fetchDevices = async ({ pageParam = 0 }) => {
    try {
      const response = await fetch(`http://localhost:5000/api/devices?skip=${pageParam}&limit=${LIMIT}`);
      if (!response.ok) {
        throw new Error("Cihazlar yüklenirken bir hata oluştu");
      }
      const data = await response.json();
      console.log("Fetched devices:", data); // Debug log
      return data;
    } catch (error) {
      console.error("Error fetching devices:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Cihazlar yüklenirken bir hata oluştu",
      });
      throw error;
    }
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ['devices', filterStatus],
    queryFn: fetchDevices,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === LIMIT ? pages.length * LIMIT : undefined;
    },
  });

  const devices = data?.pages.flat() || [];
  const itemCount = hasNextPage ? devices.length + 1 : devices.length;
  const loadMoreItems = isLoading || isFetchingNextPage ? () => {} : () => fetchNextPage();
  const isItemLoaded = (index: number) => !hasNextPage || index < devices.length;

  const handleFilterChange = async (status: "all" | "online" | "offline") => {
    setFilterStatus(status);
    await refetch();
  };

  if (isLoading && !isFetchingNextPage) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Cihazlar</h2>
        <DeviceFilters
          filterStatus={filterStatus}
          onFilterChange={handleFilterChange}
          isFormOpen={isFormOpen}
          setIsFormOpen={setIsFormOpen}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <DeviceTableHeader />
          <TableBody>
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={itemCount}
              loadMoreItems={loadMoreItems}
            >
              {({ onItemsRendered, ref }) => (
                <List
                  height={500}
                  itemCount={itemCount}
                  itemSize={60}
                  onItemsRendered={onItemsRendered}
                  ref={ref}
                  width="100%"
                >
                  {({ index, style }) => {
                    if (!isItemLoaded(index)) {
                      return (
                        <div style={style} className="p-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto" />
                        </div>
                      );
                    }
                    const device = devices[index] as Device;
                    return device ? (
                      <DeviceTableRow device={device} style={style} />
                    ) : null;
                  }}
                </List>
              )}
            </InfiniteLoader>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DeviceList;