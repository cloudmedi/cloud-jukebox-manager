import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Device } from "@/services/deviceService";
import { Checkbox } from "@/components/ui/checkbox";
import { Volume2, Play, Loader2, AlertCircle, MapPin, CheckCircle2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { QuickActions } from "./QuickActions";
import { toast } from "sonner";

interface DeviceTableRowProps {
  device: Device;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}

export const DeviceTableRow = ({ device, isSelected, onSelect }: DeviceTableRowProps) => {
  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/devices/${device._id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Cihaz silinemedi');
      }
      
      toast.success('Cihaz silindi');
    } catch (error) {
      toast.error('Cihaz silinirken bir hata oluştu');
    }
  };

  const renderPlaylistStatus = () => {
    if (!device.playlistStatus) return "-";

    switch (device.playlistStatus) {
      case "loaded":
        return (
          <div className="flex items-center gap-2 text-emerald-500">
            <Play className="h-4 w-4" />
            <span>Yüklendi</span>
          </div>
        );
      case "loading":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>İndiriliyor %{device.downloadProgress || 0}</span>
            </div>
            <Progress value={device.downloadProgress || 0} className="h-1.5 w-32" />
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span>Yükleme Hatası</span>
          </div>
        );
      default:
        return "-";
    }
  };

  return (
    <TableRow className="transition-colors hover:bg-muted/50 group relative">
      <TableCell>
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div>
            <p className="font-medium">{device.name}</p>
            <p className="text-sm text-muted-foreground">{device.location}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm">{device.token}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{device.location || "-"}</span>
        </div>
      </TableCell>
      <TableCell>{device.ipAddress || "-"}</TableCell>
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
        {renderPlaylistStatus()}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <span>%{device.volume}</span>
        </div>
      </TableCell>
      <TableCell>
        {formatDistanceToNow(new Date(device.lastSeen), {
          addSuffix: true,
          locale: tr,
        })}
      </TableCell>
      <TableCell>
        <QuickActions device={device} onDelete={handleDelete} />
      </TableCell>
    </TableRow>
  );
};