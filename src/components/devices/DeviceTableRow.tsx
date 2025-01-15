import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import type { Device } from "@/types/device";
import DeviceActions from "./DeviceActions";
import { Checkbox } from "@/components/ui/checkbox";
import { Volume2, Play, Loader2, AlertCircle, MapPin, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatBytes, formatDuration } from "@/lib/utils";
import { useDownloadProgressStore } from "@/store/downloadProgressStore";

interface DeviceTableRowProps {
  device: Device;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}

export const DeviceTableRow = ({ device, isSelected, onSelect }: DeviceTableRowProps) => {
  const downloadProgress = useDownloadProgressStore(state => state.getProgress(device.token));

  const renderPlaylistStatus = () => {
    if (!device.playlistStatus) return "-";

    switch (device.playlistStatus) {
      case "completed":
        const playlist = device.activePlaylist as { name: string };
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-sm">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-600 font-medium">
                {playlist?.name}
              </span>
            </div>
          </div>
        );
      case "downloading":
        if (!downloadProgress) return null;
        
        return (
          <div className="flex flex-col gap-1 w-[300px]">
            {/* Üstte şarkı sayısı */}
            <div className="text-xs text-muted-foreground">
              {downloadProgress.completedSongs}/{downloadProgress.totalSongs} şarkı
            </div>

            {/* Ortada progress ve yüzde */}
            <div className="flex items-center gap-2">
              <div className="w-[240px]">
                <Progress 
                  value={downloadProgress.progress || 0} 
                  className="h-2.5 [&>div]:bg-[#4ade80]"
                />
              </div>
              <span className="text-xstext-muted-foreground">
                %{(downloadProgress.progress || 0).toFixed(1)}
              </span>
            </div>

            {/* Altta şarkı ismi */}
            <div className="text-xs text-muted-foreground truncate">
              {downloadProgress.songProgress?.name}
            </div>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span>Yükleme Hatası</span>
            {device.retryCount > 0 && (
              <span className="text-xs">({device.retryCount}/3)</span>
            )}
          </div>
        );
      default:
        return "-";
    }
  };

  const getGroupColor = (groupId?: string) => {
    if (!groupId) return "";
    
    const hash = groupId.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const colors = [
      "hover:bg-blue-50/50", "hover:bg-green-50/50", "hover:bg-purple-50/50",
      "hover:bg-pink-50/50", "hover:bg-yellow-50/50", "hover:bg-orange-50/50"
    ];
    return colors[hash % colors.length];
  };

  return (
    <TableRow className={cn(
      "transition-colors group",
      getGroupColor(device.groupId)
    )}>
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
      <TableCell className="text-right">
        <DeviceActions device={device} />
      </TableCell>
    </TableRow>
  );
};
