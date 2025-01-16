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
import { useDeviceStore } from "@/store/deviceStore";
import { memo, useCallback } from "react";

interface DeviceTableRowProps {
  device: Device;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}

export const DeviceTableRow = memo(({ device, isSelected, onSelect }: DeviceTableRowProps) => {
  const downloadProgress = useDownloadProgressStore(state => state.getProgress(device.token));
  const lastSeen = useDeviceStore(state => state.getLastSeen(device.token));

  const renderPlaylistStatus = useCallback(() => {
    const playlist = device.activePlaylist as { name: string };

    // İndirme durumunu kontrol et
    if (downloadProgress?.status === "downloading") {
      // Toplam ilerlemeyi hesapla
      const completedProgress = (downloadProgress.completedSongs / downloadProgress.totalSongs) * 100;
      const currentSongProgress = ((downloadProgress.songProgress?.current || 0) / (downloadProgress.songProgress?.total || 1)) * (100 / downloadProgress.totalSongs);
      const totalProgress = completedProgress + currentSongProgress;

      return (
        <div className="flex flex-col gap-1 w-[300px]">
          <div className="text-xs text-muted-foreground">
            {downloadProgress.completedSongs}/{downloadProgress.totalSongs} şarkı
          </div>

          <div className="flex items-center gap-2">
            <div className="w-[240px]">
              <Progress 
                value={totalProgress} 
                className="h-2.5 [&>div]:bg-[#4ade80] [&>div]:duration-300"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              %{totalProgress.toFixed(1)}
            </span>
          </div>

          <div className="text-xs text-muted-foreground truncate">
            {downloadProgress.songProgress?.name}
          </div>
        </div>
      );
    }

    // Hata durumu
    if (downloadProgress?.status === "error") {
      return (
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span>Yükleme Hatası</span>
          {device.retryCount > 0 && (
            <span className="text-xs">({device.retryCount}/3)</span>
          )}
        </div>
      );
    }

    // İndirme tamamlandı veya aktif playlist varsa
    if (downloadProgress?.status === "completed" || playlist?.name) {
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {playlist?.name}
          </Badge>
        </div>
      );
    }

    return null;
  }, [device.token, device.activePlaylist, device.retryCount, downloadProgress]);

  const getGroupColor = useCallback((groupId?: string) => {
    if (!groupId) return "";
    
    const hash = groupId.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const colors = [
      "hover:bg-blue-50/50", "hover:bg-green-50/50", "hover:bg-purple-50/50",
      "hover:bg-pink-50/50", "hover:bg-yellow-50/50", "hover:bg-orange-50/50"
    ];
    return colors[hash % colors.length];
  }, []);

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
      <TableCell>{device.ipAddress || "-"}</TableCell>
      <TableCell className="font-mono text-sm">{device.token}</TableCell>
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
        {lastSeen ? formatDistanceToNow(new Date(lastSeen), {
          addSuffix: true,
          locale: tr,
        }) : '-'}
      </TableCell>
      <TableCell>
        <DeviceActions device={device} />
      </TableCell>
    </TableRow>
  );
});