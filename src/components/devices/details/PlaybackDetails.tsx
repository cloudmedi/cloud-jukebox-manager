import { Music2, PlayCircle } from "lucide-react";
import { Device } from "@/services/deviceService";

interface PlaybackDetailsProps {
  device: Device;
}

export const PlaybackDetails = ({ device }: PlaybackDetailsProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Playlist ve Çalan Şarkı</h3>
      <div className="space-y-4">
        {device.activePlaylist ? (
          <div className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Aktif Playlist</span>
              <div className="flex items-center gap-2 mt-1">
                <Music2 className="h-4 w-4 text-muted-foreground" />
                <p>{device.activePlaylist.name}</p>
              </div>
            </div>
            {device.currentSong && (
              <div>
                <span className="text-sm text-muted-foreground">Çalan Şarkı</span>
                <div className="flex items-center gap-2 mt-1 bg-muted/50 p-2 rounded-md">
                  <PlayCircle className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">{device.currentSong.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {device.currentSong.artist}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <span className="text-sm text-muted-foreground">
                Playlist Durumu
              </span>
              <p>{device.playlistStatus || "Bilinmiyor"}</p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Henüz bir playlist atanmamış</p>
        )}
      </div>
    </div>
  );
};