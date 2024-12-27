import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Device } from "@/services/deviceService";
import DeviceActions from "./DeviceActions";
import { Checkbox } from "@/components/ui/checkbox";
import { Volume2, Play, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DeviceTableRowProps {
  device: Device;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}

export const DeviceTableRow = ({ device, isSelected, onSelect }: DeviceTableRowProps) => {
  const getPlaylistStatusInfo = (status: string | null) => {
    switch (status) {
      case "loaded":
        return {
          label: "Oynatmaya Hazır",
          icon: <Play className="h-4 w-4" />,
          variant: "success" as const,
          tooltip: "Playlist yüklenmiş ve oynatmaya hazır"
        };
      case "loading":
        return {
          label: "İndiriliyor",
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          variant: "warning" as const,
          tooltip: "Playlist şu anda cihaza indiriliyor"
        };
      case "error":
        return {
          label: "Yükleme Hatası",
          icon: <AlertCircle className="h-4 w-4" />,
          variant: "destructive" as const,
          tooltip: "Playlist yüklenirken bir hata oluştu"
        };
      default:
        return {
          label: "Playlist Yok",
          icon: null,
          variant: "secondary" as const,
          tooltip: "Henüz bir playlist atanmamış"
        };
    }
  };

  const statusInfo = getPlaylistStatusInfo(device.playlistStatus);

  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
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
      <TableCell>{device.location || "-"}</TableCell>
      <TableCell>{device.ipAddress || "-"}</TableCell>
      <TableCell>
        <Badge
          variant={device.isOnline ? "success" : "destructive"}
          className="capitalize"
        >
          {device.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
        </Badge>
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-2">
                <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                  {statusInfo.icon}
                  <span>{statusInfo.label}</span>
                </Badge>
                {device.playlistStatus === "loading" && (
                  <Progress value={45} className="h-1 w-full" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{statusInfo.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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