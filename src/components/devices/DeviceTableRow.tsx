import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Device } from "@/services/deviceService";
import DeviceActions from "./DeviceActions";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Volume2, 
  Play, 
  Pause, 
  X, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  Loader2,
  AlertCircle 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DeviceTableRowProps {
  device: Device;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}

export const DeviceTableRow = ({ device, isSelected, onSelect }: DeviceTableRowProps) => {
  const renderPlaybackStatus = () => {
    if (!device.playbackStatus) return null;

    switch (device.playbackStatus) {
      case "playing":
        return (
          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 flex items-center gap-1">
            <Play className="h-3 w-3" />
            Çalıyor
          </Badge>
        );
      case "paused":
        return (
          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1">
            <Pause className="h-3 w-3" />
            Duraklatıldı
          </Badge>
        );
      case "no-playlist":
        return (
          <Badge variant="default" className="bg-red-500 hover:bg-red-600 flex items-center gap-1">
            <X className="h-3 w-3" />
            Playlist Yok
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderPlaylistStatus = () => {
    if (!device.playlistStatus) return "-";

    switch (device.playlistStatus) {
      case "loaded":
        return (
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="h-4 w-4" />
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
    <TableRow className={cn(
      "transition-colors group",
      device.groupId && "hover:bg-muted/50"
    )}>
      <TableCell>
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              device.isOnline ? "bg-emerald-500" : "bg-red-500"
            )} />
            <div>
              <p className="font-medium">{device.name}</p>
              <p className="text-sm text-muted-foreground">{device.location}</p>
            </div>
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
        <div className="flex flex-col gap-2">
          {device.isOnline ? (
            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Çevrimiçi
            </Badge>
          ) : (
            <Badge variant="default" className="bg-red-500 hover:bg-red-600 flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Çevrimdışı
            </Badge>
          )}
          {renderPlaybackStatus()}
        </div>
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
      <TableCell className="text-right">
        <DeviceActions device={device} />
      </TableCell>
    </TableRow>
  );
};