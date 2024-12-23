import { memo } from "react";
import { Music2, Trash2, Send } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PlaylistCardProps {
  playlist: {
    _id: string;
    name: string;
    description?: string;
    songs: any[];
    totalDuration?: number;
    artwork?: string;
    genre?: string;
  };
  onDelete?: (id: string) => void;
}

export const PlaylistCard = memo(({ playlist, onDelete }: PlaylistCardProps) => {
  return (
    <Card 
      className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 w-[200px]"
    >
      <CardHeader className="relative aspect-square p-0">
        {playlist.artwork ? (
          <img
            src={`http://localhost:5000${playlist.artwork}`}
            alt={playlist.name}
            className="h-[200px] w-[200px] object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-[200px] w-[200px] items-center justify-center bg-gradient-to-br from-sidebar-primary/20 to-sidebar-accent/20">
            <Music2 className="h-24 w-24 text-muted-foreground/40" />
          </div>
        )}
        
        <div className="absolute right-2 top-2 flex gap-1">
          {onDelete && (
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDelete(playlist._id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              // Send functionality will be implemented here
              console.log("Send playlist:", playlist._id);
            }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
        
      <CardContent className="space-y-2 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-1 text-base font-semibold tracking-tight">
            {playlist.name}
          </h3>
          {playlist.genre && (
            <Badge variant="secondary" className="text-xs">
              {playlist.genre}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Music2 className="h-3 w-3" />
            <span>{playlist.songs?.length || 0} şarkı</span>
          </div>
          <span>
            {playlist.totalDuration
              ? `${Math.floor(playlist.totalDuration / 60)} dk`
              : "0 dk"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});

PlaylistCard.displayName = "PlaylistCard";