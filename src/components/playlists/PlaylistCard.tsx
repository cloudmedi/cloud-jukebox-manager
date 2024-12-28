import { memo } from "react";
import { Send, Music2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";

interface PlaylistCardProps {
  playlist: {
    _id: string;
    name: string;
    description?: string;
    songs: any[];
    totalDuration?: number;
    artwork?: string;
  };
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  onPlay?: (id: string) => void;
  onSendToDevice?: () => void;
}

export const PlaylistCard = memo(({ playlist, onPlay, onSendToDevice }: PlaylistCardProps) => {
  return (
    <Card className="group relative w-full h-[360px] flex flex-col bg-white border shadow-sm hover:shadow-md transition-all duration-300">
      {/* Artwork */}
      <div className="relative aspect-square w-full overflow-hidden">
        {playlist.artwork ? (
          <img
            src={`http://localhost:5000${playlist.artwork}`}
            alt={playlist.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Music2 className="h-24 w-24 text-gray-400" />
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-16 w-16 rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={() => onPlay?.(playlist._id)}
          >
            <Play className="h-8 w-8" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-4 space-y-2">
        <h3 className="font-semibold text-lg line-clamp-1">
          {playlist.name}
        </h3>
        
        <div className="flex items-center text-sm text-muted-foreground space-x-2">
          <span>{playlist.songs?.length || 0} şarkı</span>
          <span>•</span>
          <span>{formatDuration(playlist.totalDuration || 0)}</span>
        </div>

        {/* Actions */}
        <div className="mt-auto pt-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onSendToDevice}
          >
            <Send className="mr-2 h-4 w-4" />
            Cihaza Gönder
          </Button>
        </div>
      </div>
    </Card>
  );
});

PlaylistCard.displayName = "PlaylistCard";