import { Button } from "@/components/ui/button";
import { Play, Trash2 } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { Song } from "@/types/song";

interface SongListProps {
  songs: Song[];
  onRemove: (songId: string) => void;
  isLoading?: boolean;
}

export const SongList = ({ songs, onRemove, isLoading }: SongListProps) => {
  if (songs.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Bu playlist'te henüz şarkı yok
      </div>
    );
  }

  return (
    <div className="space-y-1 p-4">
      {songs.map((song) => (
        <div
          key={song._id}
          className="flex items-center justify-between rounded-lg border p-2 hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Play className="h-4 w-4" />
            </Button>
            <div>
              <p className="font-medium">{song.name}</p>
              <p className="text-sm text-muted-foreground">{song.artist}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {formatDuration(song.duration)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(song._id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};