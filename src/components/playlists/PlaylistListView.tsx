import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Play, Edit, Send, Trash2, Music2, Clock, Calendar, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Playlist } from "@/types/playlist";
import { formatDuration } from "@/lib/utils";

interface PlaylistListProps {
  playlists: Playlist[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export const PlaylistList = ({ playlists, onDelete, onEdit }: PlaylistListProps) => {
  return (
    <div className="space-y-2">
      {playlists.map((playlist) => (
        <div
          key={playlist._id}
          className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
              {playlist.artwork ? (
                <img
                  src={`http://localhost:5000${playlist.artwork}`}
                  alt={playlist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music2 className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            
            <div className="space-y-1">
              <h3 className="font-medium">{playlist.name}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Music2 className="h-4 w-4" />
                  <span>{playlist.songs.length} şarkı</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(playlist.totalDuration || 0)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDistanceToNow(new Date(playlist.updatedAt), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Laptop className="h-4 w-4" />
                  <span>3 cihazda aktif</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Play className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onEdit(playlist._id)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Send className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onDelete(playlist._id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};