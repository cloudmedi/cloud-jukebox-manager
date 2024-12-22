import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Power, Settings } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import DeviceForm from "./DeviceForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from "react-window-infinite-loader";

interface Device {
  _id: string;
  name: string;
  token: string;
  location: string;
  isOnline: boolean;
  volume: number;
  lastSeen: string;
}

const LIMIT = 20; // Her sayfada gösterilecek cihaz sayısı

const DeviceList = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const fetchDevices = async ({ pageParam = 0 }) => {
    const response = await fetch(`http://localhost:5000/api/devices?skip=${pageParam}&limit=${LIMIT}`);
    if (!response.ok) {
      throw new Error("Cihazlar yüklenirken bir hata oluştu");
    }
    return response.json();
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['devices'],
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

  if (isLoading && !isFetchingNextPage) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    if (!isItemLoaded(index)) {
      return (
        <TableRow style={style}>
          <TableCell colSpan={7} className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto" />
          </TableCell>
        </TableRow>
      );
    }

    const device = devices[index];
    return (
      <TableRow style={style}>
        <TableCell className="font-medium">{device.name}</TableCell>
        <TableCell>{device.token}</TableCell>
        <TableCell>{device.location}</TableCell>
        <TableCell>
          <Badge
            variant={device.isOnline ? "success" : "secondary"}
            className="flex w-fit items-center gap-1"
          >
            <Power className="h-3 w-3" />
            {device.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
          </Badge>
        </TableCell>
        <TableCell>{device.volume}%</TableCell>
        <TableCell>
          {new Date(device.lastSeen).toLocaleString("tr-TR")}
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    );
  };

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
          <DialogContent>
            <DeviceForm onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cihaz Adı</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Konum</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Ses Seviyesi</TableHead>
              <TableHead>Son Görülme</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
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
                  {Row}
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