import { memo } from "react";
import { Send, Trash2, Music2, MoreVertical, Pencil, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SendPlaylistDialog } from "./SendPlaylistDialog";
import { useState } from "react";

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
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 w-full">
        <div className="relative aspect-square">
          {playlist.artwork ? (
            <img
              src={`http://localhost:5000${playlist.artwork}`}
              alt={playlist.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sidebar-primary/20 to-sidebar-accent/20">
              <Music2 className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/20 hover:bg-white/40"
                onClick={() => onPlay?.(playlist._id)}
              >
                <Play className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/20 hover:bg-white/40"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
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
          </div>
        </div>
        
        <CardContent className="p-3">
          <div className="space-y-1">
            <h3 className="line-clamp-1 text-sm font-medium">
              {playlist.name}
            </h3>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Music2 className="h-3 w-3" />
                <span>{playlist.songs?.length || 0}</span>
              </div>
              {playlist.genre && (
                <Badge variant="secondary" className="text-[10px] h-4">
                  {playlist.genre}
                </Badge>
              )}
            </div>
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