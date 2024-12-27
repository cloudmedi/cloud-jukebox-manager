import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PlaylistCardProps {
  playlist: any;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onPlay: (id: string) => void;
}

export function PlaylistCard({ playlist, onDelete, onEdit, onPlay }: PlaylistCardProps) {
  return (
    <Card className="group relative overflow-hidden border border-gray-200 rounded-lg bg-white hover:shadow-md transition-all duration-200">
      {/* Playlist Artwork */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {playlist.artwork ? (
          <img
            src={playlist.artwork}
            alt={playlist.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-100">
            <Play className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:text-white hover:bg-white/20"
            onClick={() => onPlay(playlist._id)}
          >
            <Play className="h-12 w-12" />
          </Button>
        </div>
      </div>

      {/* Playlist Info */}
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-gray-900 truncate">
              {playlist.name}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {playlist.songs?.length || 0} şarkı
            </p>
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(playlist._id)}>
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(playlist._id)}
              >
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}