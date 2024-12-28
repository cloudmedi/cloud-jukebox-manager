import { Music, MoreVertical, PlayCircle, Pencil, Trash } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Song } from "@/types/song";
import { formatSongDuration } from "@/lib/utils";

export interface SongTableRowProps {
  song: Song;
  onEdit?: (song: Song) => void;
  onDelete: (id: string) => Promise<void>;
  isSelected?: boolean;
  onSelect?: (song: Song, checked: boolean) => void;
}

export const SongTableRow = ({ 
  song, 
  onEdit, 
  onDelete,
  isSelected,
  onSelect
}: SongTableRowProps) => {
  return (
    <TableRow key={song._id}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect?.(song, checked as boolean)}
          aria-label={`${song.name} seç`}
          className="ml-2"
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
              {song.artwork ? (
                <img 
                  src={`http://localhost:5000${song.artwork}`} 
                  alt={`${song.name} artwork`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
              ) : (
                <Music className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <button
              className="absolute inset-0 bg-black/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <PlayCircle className="h-6 w-6 text-white" />
            </button>
          </div>
          <div>
            <p className="font-medium">{song.name}</p>
            <p className="text-sm text-muted-foreground">{song.artist}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>{song.artist}</TableCell>
      <TableCell>{song.genre}</TableCell>
      <TableCell>{song.album || "-"}</TableCell>
      <TableCell>{formatSongDuration(song.duration)}</TableCell>
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
            <DropdownMenuItem onClick={() => onEdit?.(song)}>
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