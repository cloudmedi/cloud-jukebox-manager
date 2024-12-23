import { PlaylistCard } from "./PlaylistCard";
import { Playlist } from "@/types/playlist";

interface PlaylistGridProps {
  playlists: Playlist[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export const PlaylistGrid = ({ playlists, onDelete, onEdit }: PlaylistGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {playlists.map((playlist) => (
        <PlaylistCard
          key={playlist._id}
          playlist={playlist}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};