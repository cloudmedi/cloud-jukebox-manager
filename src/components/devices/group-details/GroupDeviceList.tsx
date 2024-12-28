import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { Device } from "@/services/deviceService";

interface GroupDeviceListProps {
  groupId: string;
}

export const GroupDeviceList = ({ groupId }: GroupDeviceListProps) => {
  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["group-devices", groupId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5000/api/devices?groupId=${groupId}`);
      if (!response.ok) throw new Error("Cihazlar yüklenemedi");
      return response.json();
    },
  });

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cihaz Adı</TableHead>
            <TableHead>Konum</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Son Görülme</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device: Device) => (
            <TableRow key={device._id}>
              <TableCell>{device.name}</TableCell>
              <TableCell>{device.location}</TableCell>
              <TableCell>
                {device.isOnline ? (
                  <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Çevrimiçi
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="bg-red-500/15 text-red-500 hover:bg-red-500/25">
                    <XCircle className="h-3 w-3 mr-1" />
                    Çevrimdışı
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {new Date(device.lastSeen).toLocaleString("tr-TR")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};