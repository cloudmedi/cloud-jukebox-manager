import { Music2, PlayCircle } from "lucide-react";
import { Device } from "@/services/deviceService";
import { Separator } from "@/components/ui/separator";

interface PlaybackDetailsProps {
  device: Device;
}

export const PlaybackDetails = ({ device }: PlaybackDetailsProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Playlist ve Çalan Şarkı</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Aktif Playlist</span>
          <div className="flex items-center gap-2">
            <Music2 className="h-4 w-4 text-muted-foreground" />
            <p>{device.activePlaylist?.name || "Playlist atanmamış"}</p>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Playlist Durumu</span>
          <p>{device.playlistStatus || "Bilinmiyor"}</p>
        </div>
      </div>

      <Separator />

      {device.currentSong && (
        <div>
          <span className="text-sm text-muted-foreground">Çalan Şarkı</span>
          <div className="flex items-center gap-2 mt-2 bg-muted/50 p-3 rounded-md">
            <PlayCircle className="h-5 w-5 text-primary animate-pulse" />
            <div>
              <p className="font-medium">{device.currentSong.name}</p>
              <p className="text-sm text-muted-foreground">
                {device.currentSong.artist}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};