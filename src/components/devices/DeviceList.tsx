import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Device } from "@/services/deviceService";
import DeviceForm from "./DeviceForm";
import DeviceActions from "./DeviceActions";

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
      return response.json();
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === LIMIT ? pages.length * LIMIT : undefined;
    },
  });

  const devices = data?.pages.flat() || [];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          <TableHeader>
            <TableRow>
              <TableHead>Cihaz Adı</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Konum</TableHead>
              <TableHead>IP Adresi</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Playlist</TableHead>
              <TableHead>Ses</TableHead>
              <TableHead>Son Görülme</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device: Device) => (
              <TableRow key={device._id}>
                <TableCell className="font-medium">{device.name}</TableCell>
                <TableCell>{device.token}</TableCell>
                <TableCell>{device.location}</TableCell>
                <TableCell>{device.ipAddress || "-"}</TableCell>
                <TableCell>
                  <Badge
                    variant={device.isOnline ? "success" : "secondary"}
                    className="flex w-fit items-center gap-1"
                  >
                    {device.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {device.activePlaylist ? (
                    <Badge variant="outline">
                      {device.activePlaylist.name}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Playlist Yok
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{device.volume}%</span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(device.lastSeen)}</TableCell>
                <TableCell className="text-right">
                  <DeviceActions device={device} />
                </TableCell>
              </TableRow>
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