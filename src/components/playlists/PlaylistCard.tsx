import { memo } from "react";
import { MoreVertical, Play, Pencil, Trash2, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  onEdit: (id: string) => void;
  onPlay: (id: string) => void;
}

export const PlaylistCard = memo(({ playlist, onDelete, onEdit, onPlay }: PlaylistCardProps) => {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="relative aspect-square p-0 mb-4">
        {playlist.artwork ? (
          <img
            src={`http://localhost:5000${playlist.artwork}`}
            alt={playlist.name}
            className="w-full h-full object-cover rounded-t-lg"
          />
        ) : (
          <div className="w-full h-full bg-accent/50 rounded-t-lg flex items-center justify-center">
            <Music2 className="h-20 w-20 text-muted-foreground/25" />
          </div>
        )}
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            "absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity",
            "bg-background/50 backdrop-blur-sm hover:bg-background/75"
          )}
          onClick={() => onPlay(playlist._id)}
        >
          <Play className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-lg font-semibold truncate">
              {playlist.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {playlist.description || "Açıklama yok"}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPlay(playlist._id)}>
                <Play className="mr-2 h-4 w-4" />
                Oynat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(playlist._id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(playlist._id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{playlist.songs?.length || 0} şarkı</span>
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