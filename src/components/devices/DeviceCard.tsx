import { Device } from "@/services/deviceService";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Volume2, Play, Loader2, AlertCircle, MapPin, CheckCircle2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import DeviceActions from "./DeviceActions";
import { cn } from "@/lib/utils";

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

  const getGroupColor = (groupId?: string) => {
    if (!groupId) return "bg-gray-100";
    
    // Hash the groupId to generate a consistent color
    const hash = groupId.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const colors = [
      "bg-blue-100", "bg-green-100", "bg-purple-100", 
      "bg-pink-100", "bg-yellow-100", "bg-orange-100"
    ];
    return colors[hash % colors.length];
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-lg",
      getGroupColor(device.groupId)
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox checked={isSelected} onCheckedChange={onSelect} />
            <div>
              <h3 className="font-medium">{device.name}</h3>
              <p className="text-sm text-muted-foreground font-mono">{device.token}</p>
            </div>
          </div>
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