import { Device } from "@/services/deviceService";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Volume2, Play, Pause, X, MapPin, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import DeviceActions from "./DeviceActions";
import { cn } from "@/lib/utils";

interface DeviceCardProps {
  device: Device;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}

export const DeviceCard = ({ device, isSelected, onSelect }: DeviceCardProps) => {
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
    <Card className={cn(
      "transition-all duration-200 hover:shadow-lg",
      device.groupId ? "bg-muted/50" : ""
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox checked={isSelected} onCheckedChange={onSelect} />
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                device.isOnline ? "bg-emerald-500" : "bg-red-500"
              )} />
              <div>
                <h3 className="font-medium">{device.name}</h3>
                <p className="text-sm text-muted-foreground font-mono">{device.token}</p>
              </div>
            </div>
          </div>
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
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{device.location || "-"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <span>%{device.volume}</span>
        </div>
        <div className="text-sm">{renderPlaylistStatus()}</div>
        <div className="text-sm text-muted-foreground">
          Son görülme: {formatDistanceToNow(new Date(device.lastSeen), {
            addSuffix: true,
            locale: tr,
          })}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-end">
        <DeviceActions device={device} />
      </CardFooter>
    </Card>
  );
};