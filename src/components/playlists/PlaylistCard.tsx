import { memo } from "react";
import { Play, Pencil, Trash2, Music2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardHeader className="relative aspect-square p-0">
        {playlist.artwork ? (
          <img
            src={`http://localhost:5000${playlist.artwork}`}
            alt={playlist.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/10 to-blue-500/10">
            <Music2 className="h-24 w-24 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            "absolute bottom-4 right-4 opacity-0 transition-all duration-300 group-hover:opacity-100",
            "bg-white/90 backdrop-blur-sm hover:bg-white"
          )}
          onClick={() => onPlay(playlist._id)}
        >
          <Play className="h-5 w-5 text-primary" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-3 p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="line-clamp-1 text-xl font-semibold tracking-tight">
              {playlist.name}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {playlist.description || "Açıklama yok"}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground/60 hover:text-primary"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onPlay(playlist._id)} className="gap-2">
                <Play className="h-4 w-4" />
                Oynat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(playlist._id)} className="gap-2">
                <Pencil className="h-4 w-4" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(playlist._id)} 
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Music2 className="h-4 w-4" />
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