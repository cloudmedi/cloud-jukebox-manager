import { memo } from "react";
import { Send, Trash2, Music2, MoreVertical, Pencil, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SendPlaylistDialog } from "./SendPlaylistDialog";
import { useState } from "react";
import { formatDuration } from "@/lib/utils";

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
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  onPlay?: (id: string) => void;
}

export const PlaylistCard = memo(({ playlist, onDelete, onEdit, onPlay }: PlaylistCardProps) => {
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);

  return (
    <>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 w-[200px]">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </CardHeader>
        
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <h3 className="line-clamp-1 text-base font-semibold tracking-tight">
                {playlist.name}
              </h3>
              {playlist.genre && (
                <Badge variant="secondary" className="text-xs">
                  {playlist.genre}
                </Badge>
              )}
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
                {onPlay && (
                  <DropdownMenuItem onClick={() => onPlay(playlist._id)} className="gap-2">
                    <Play className="h-4 w-4" />
                    Oynat
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(playlist._id)} className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Düzenle
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setIsSendDialogOpen(true)} className="gap-2">
                  <Send className="h-4 w-4" />
                  Gönder
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

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Music2 className="h-3 w-3" />
              <span>{playlist.songs?.length || 0} şarkı</span>
            </div>
            <span>
              {formatDuration(playlist.totalDuration || 0)}
            </span>
          </div>
        </CardContent>
      </Card>

      <SendPlaylistDialog 
        isOpen={isSendDialogOpen}
        onClose={() => setIsSendDialogOpen(false)}
        playlist={playlist}
      />
    </>
  );
});

PlaylistCard.displayName = "PlaylistCard";