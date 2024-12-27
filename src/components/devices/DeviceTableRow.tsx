import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Device } from "@/services/deviceService";
import DeviceActions from "./DeviceActions";
import { Checkbox } from "@/components/ui/checkbox";
import { Volume2, Play, Loader2, AlertCircle, MapPin, CheckCircle2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DeviceTableRowProps {
  device: Device;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}

export const DeviceTableRow = ({ device, isSelected, onSelect }: DeviceTableRowProps) => {
  const renderPlaylistStatus = () => {
    if (!device.playlistStatus) return "-";

    switch (device.playlistStatus) {
      case "loaded":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-2 text-emerald-500">
                  <Play className="h-4 w-4" />
                  <span>Yüklendi</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Playlist başarıyla yüklendi ve oynatmaya hazır</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case "loading":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-orange-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>İndiriliyor %{device.downloadProgress || 0}</span>
                  </div>
                  <Progress value={device.downloadProgress || 0} className="h-1.5 w-32" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Playlist indiriliyor, lütfen bekleyin</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case "error":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <span>Yükleme Hatası</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Playlist yüklenirken bir hata oluştu</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default:
        return "-";
    }
  };

  return (
    <TableRow className="transition-colors hover:bg-muted/50 group">
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
          <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 group-hover:bg-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Çevrimiçi
          </Badge>
        ) : (
          <Badge variant="destructive" className="bg-red-500/15 text-red-500 hover:bg-red-500/25 group-hover:bg-red-500/20">
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
      <TableCell className="text-right">
        <DeviceActions device={device} />
      </TableCell>
    </TableRow>
  );
};