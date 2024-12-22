import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Power, Music, Check, Loader, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Device } from "@/services/deviceService";
import DeviceActions from "./DeviceActions";

interface DeviceTableRowProps {
  device: Device;
  style?: React.CSSProperties;
}

export const DeviceTableRow = ({ device, style }: DeviceTableRowProps) => {
  const getPlaylistStatusBadge = () => {
    if (!device.activePlaylist) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Music className="h-3 w-3" />
          Playlist Atanmamış
        </Badge>
      );
    }

    switch (device.playlistStatus) {
      case 'loaded':
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="success" className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Yüklendi
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{device.activePlaylist.name}</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'loading':
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="warning" className="flex items-center gap-1">
                <Loader className="h-3 w-3 animate-spin" />
                Yükleniyor
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{device.activePlaylist.name}</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'error':
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Hata
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Playlist yüklenirken hata oluştu</p>
            </TooltipContent>
          </Tooltip>
        );
      default:
        return (
          <Badge variant="secondary">
            Durum Bilinmiyor
          </Badge>
        );
    }
  };

  return (
    <TableRow style={style}>
      <TableCell className="font-medium">{device.name}</TableCell>
      <TableCell>{device.token}</TableCell>
      <TableCell>{device.location}</TableCell>
      <TableCell>{device.ipAddress || "-"}</TableCell>
      <TableCell>
        <Badge
          variant={device.isOnline ? "success" : "secondary"}
          className="flex w-fit items-center gap-1"
        >
          <Power className="h-3 w-3" />
          {device.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
        </Badge>
      </TableCell>
      <TableCell>{getPlaylistStatusBadge()}</TableCell>
      <TableCell>{device.volume}%</TableCell>
      <TableCell>
        {new Date(device.lastSeen).toLocaleString("tr-TR")}
      </TableCell>
      <TableCell className="text-right">
        <DeviceActions device={device} />
      </TableCell>
    </TableRow>
  );
};