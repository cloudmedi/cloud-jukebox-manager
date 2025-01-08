import { Device } from "@/types/device";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  Volume2, 
  Play, 
  Loader2, 
  AlertCircle, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import DeviceActions from "./DeviceActions";
import { cn } from "@/lib/utils";
import { formatBytes, formatDuration } from "@/lib/utils";

interface DeviceCardProps {
  device: Device;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}

export const DeviceCard = ({ device, isSelected, onSelect }: DeviceCardProps) => {
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
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-orange-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>İndiriliyor</span>
            </div>
            
            <div className="space-y-1">
              <Progress value={device.downloadProgress || 0} className="h-1.5" />
              <div className="grid grid-cols-2 text-xs text-muted-foreground">
                <div>İlerleme: %{Math.round(device.downloadProgress || 0)}</div>
                <div className="text-right">{device.downloadedSongs || 0}/{device.totalSongs || 0} şarkı</div>
              </div>
              
              {device.downloadSpeed && device.downloadSpeed > 0 && (
                <div className="text-xs text-muted-foreground">
                  Hız: {formatBytes(device.downloadSpeed)}/s
                </div>
              )}
              
              {device.estimatedTimeRemaining && device.estimatedTimeRemaining > 0 && (
                <div className="text-xs text-muted-foreground">
                  Kalan süre: {formatDuration(device.estimatedTimeRemaining)}
                </div>
              )}
            </div>
          </div>
        );
      case "error":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span>Yükleme Hatası</span>
            </div>
            {device.retryCount > 0 && (
              <div className="text-xs text-muted-foreground">
                Deneme: {device.retryCount}/3
              </div>
            )}
            {device.lastError && (
              <div className="text-xs text-red-500">
                {device.lastError}
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm"
              className="w-full"
              onClick={() => {/* Retry logic will be implemented */}}
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Tekrar Dene
            </Button>
          </div>
        );
      default:
        return "-";
    }
  };

  const getGroupColor = (groupId?: string | null) => {
    if (!groupId) return "bg-gray-100";
    
    const hash = groupId.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const colors = [
      "bg-blue-100", "bg-green-100", "bg-purple-100", 
      "bg-pink-100", "bg-yellow-100", "bg-orange-100"
    ];
    return colors[hash % colors.length];
  };

  return (
    <Card className={cn(
      "group relative transition-all duration-200",
      "hover:shadow-lg hover:border-primary/20",
      device.isOnline ? "bg-card" : "bg-muted/30"
    )}>
      <CardHeader className="space-y-0 p-4">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{device.name}</span>
              <Badge variant={device.isOnline ? "default" : "secondary"} className="h-5">
                {device.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{device.location || "Konum Yok"}</span>
            </div>
          </div>
          <DeviceActions device={device} />
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Ses Seviyesi</div>
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-primary" />
              <span className="font-medium">{device.volume || 0}%</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Son Görülme</div>
            <div className="text-sm">
              {device.lastSeen
                ? formatDistanceToNow(new Date(device.lastSeen), {
                    addSuffix: true,
                    locale: tr,
                  })
                : "-"}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-sm text-muted-foreground">Playlist Durumu</div>
          <div className="min-h-[80px]">{renderPlaylistStatus()}</div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
          <span>ID: {device.token}</span>
          <span>v{device.version || "1.0.0"}</span>
        </div>
      </CardFooter>
    </Card>
  );
};