import { memo, useState } from "react";
import { Play, Pencil, Trash2, Music2, MoreVertical, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/components/layout/MainLayout";
import { SendPlaylistDialog } from "./SendPlaylistDialog";
import WebSocketService from "@/services/websocketService";

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
  onEdit: (id: string) => void;
  onPlay: (id: string) => void;
}

export const PlaylistCard = memo(({ playlist, onDelete, onEdit, onPlay }: PlaylistCardProps) => {
  const { setShowPlayer } = usePlayer();
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  
  const handlePlay = () => {
    setShowPlayer(true);
    onPlay(playlist._id);
    // Electron'a play komutunu gönder
    WebSocketService.sendMessage({
      type: 'command',
      command: 'play',
      playlistId: playlist._id
    });
  };

  const handleCardClick = () => {
    handlePlay();
  };

  return (
    <>
      <Card 
        className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 w-[200px] cursor-pointer"
        onClick={handleCardClick}
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "absolute bottom-4 right-4 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 translate-y-4",
              "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 h-10 w-10"
            )}
            onClick={(e) => {
              e.stopPropagation();
              handlePlay();
            }}
          >
            <Play className="h-5 w-5" />
          </Button>
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
                <DropdownMenuItem onClick={handlePlay} className="gap-2">
                  <Play className="h-4 w-4" />
                  Oynat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsSendDialogOpen(true)} className="gap-2">
                  <Send className="h-4 w-4" />
                  Gönder
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

      <SendPlaylistDialog 
        isOpen={isSendDialogOpen}
        onClose={() => setIsSendDialogOpen(false)}
        playlist={playlist}
      />
    </>
  );
});

PlaylistCard.displayName = "PlaylistCard";