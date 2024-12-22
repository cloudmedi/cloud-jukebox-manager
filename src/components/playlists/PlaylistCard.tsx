import { memo } from "react";
import { MoreVertical, Play, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PlaylistCardProps {
  playlist: {
    _id: string;
    name: string;
    description?: string;
    songs: any[];
    totalDuration?: number;
  };
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onPlay: (id: string) => void;
}

export const PlaylistCard = memo(({ playlist, onDelete, onEdit, onPlay }: PlaylistCardProps) => {
  return (
    <div
      className="border rounded-lg p-4 space-y-4 hover:shadow-md transition-shadow"
      role="article"
      aria-label={`Playlist: ${playlist.name}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold truncate">{playlist.name}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Playlist seçenekleri"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onPlay(playlist._id)}
              onKeyDown={(e) => e.key === 'Enter' && onPlay(playlist._id)}
              role="menuitem"
              tabIndex={0}
            >
              <Play className="mr-2 h-4 w-4" />
              Oynat
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onEdit(playlist._id)}
              onKeyDown={(e) => e.key === 'Enter' && onEdit(playlist._id)}
              role="menuitem"
              tabIndex={0}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Düzenle
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(playlist._id)}
              onKeyDown={(e) => e.key === 'Enter' && onDelete(playlist._id)}
              role="menuitem"
              tabIndex={0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2">
        {playlist.description || "Açıklama yok"}
      </p>

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{playlist.songs?.length || 0} şarkı</span>
        <span>
          {playlist.totalDuration
            ? `${Math.floor(playlist.totalDuration / 60)} dk`
            : "0 dk"}
        </span>
      </div>
    </div>
  );
});

PlaylistCard.displayName = 'PlaylistCard';