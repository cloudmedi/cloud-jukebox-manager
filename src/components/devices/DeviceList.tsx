import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

interface Device {
  _id: string;
  name: string;
  token: string;
  location: string;
  isOnline: boolean;
  volume: number;
  lastSeen: string;
}

const DeviceList = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const { data: devices, isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) {
        throw new Error("Cihazlar yüklenirken bir hata oluştu");
      }
      return response.json();
    },
  });

  if (isLoading) {
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
            {devices?.map((device: Device) => (
              <TableRow key={device._id}>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DeviceList;