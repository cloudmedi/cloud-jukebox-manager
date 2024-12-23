import { Music, MoreVertical, PlayCircle, Pencil, Trash } from "lucide-react";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Song } from "@/types/song";
import { formatDuration } from "@/lib/utils";
import { usePlaybackStore } from "@/store/playbackStore";
import { usePlayer } from "@/components/layout/MainLayout";

interface SongTableRowProps {
  song: Song;
  onEdit: (song: Song) => void;
  onDelete: (id: string) => void;
}

export const SongTableRow = ({ song, onEdit, onDelete }: SongTableRowProps) => {
  const setCurrentSong = usePlaybackStore((state) => state.setCurrentSong);
  const { setShowPlayer } = usePlayer();

  const handlePlay = () => {
    setCurrentSong(song);
    setShowPlayer(true);
  };

  return (
    <TableRow key={song._id}>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center">
              <Music className="h-4 w-4 text-muted-foreground" />
            </div>
            <button
              onClick={handlePlay}
              className="absolute inset-0 bg-black/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <PlayCircle className="h-5 w-5 text-white" />
            </button>
          </div>
          {song.name}
        </div>
      </TableCell>
      <TableCell>{song.artist}</TableCell>
      <TableCell>{song.genre}</TableCell>
      <TableCell>{song.album || "-"}</TableCell>
      <TableCell>{formatDuration(song.duration)}</TableCell>
      <TableCell>
        {new Date(song.createdAt).toLocaleDateString("tr-TR")}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(song)}>
              <Pencil className="mr-2 h-4 w-4" />
              Düzenle
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(song._id)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};