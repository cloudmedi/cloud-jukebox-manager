import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Table, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Device } from "@/services/deviceService";
import { DeviceTableHeader } from "./DeviceTableHeader";
import { DeviceTableRow } from "./DeviceTableRow";
import DeviceForm from "./DeviceForm";

const LIMIT = 20;

const DeviceList = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ['devices'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`http://localhost:5000/api/devices?skip=${pageParam}&limit=${LIMIT}`);
      if (!response.ok) throw new Error("Cihazlar yüklenirken bir hata oluştu");
      return response.json() as Promise<Device[]>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: Device[], pages) => {
      return lastPage.length === LIMIT ? pages.length * LIMIT : undefined;
    },
  });

  const devices = data?.pages.flat() || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Cihazlar</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Cihaz
            </Button>
          </DialogTrigger>
          <DeviceForm onSuccess={() => {
            setIsFormOpen(false);
            refetch();
          }} />
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <DeviceTableHeader />
          <TableBody>
            {devices.map((device: Device) => (
              <DeviceTableRow key={device._id} device={device} />
            ))}
          </TableBody>
        </Table>

        {hasNextPage && (
          <div className="flex justify-center p-4">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Yükleniyor
                </>
              ) : (
                "Daha Fazla Yükle"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceList;