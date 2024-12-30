import { memo } from "react";
import { Play, Music2 } from "lucide-react";
import { Card } from "@/components/ui/card";

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
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg">
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
            <Music2 className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            onClick={() => onPlay?.(playlist._id)}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Play className="h-12 w-12 text-white" />
          </button>
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 line-clamp-1">
          {playlist.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2">
          {playlist.description || "No description"}
        </p>
      </div>
    </Card>
  );
});

PlaylistCard.displayName = "PlaylistCard";