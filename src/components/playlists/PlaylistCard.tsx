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
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="relative aspect-square">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="absolute bottom-4 left-4 right-4">
              <Button
                variant="secondary"
                size="sm"
                className="w-full bg-white/90 hover:bg-white"
                onClick={() => onPlay?.(playlist._id)}
              >
                <Play className="h-4 w-4 mr-2" />
                Oynat
              </Button>
            </div>
          </div>
        </div>
        
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <h3 className="font-semibold text-gray-900 line-clamp-1">
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
                  className="h-8 w-8 text-gray-500 hover:text-gray-900"
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
                  className="gap-2 text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
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