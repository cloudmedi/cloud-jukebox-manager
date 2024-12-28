import { Music, MoreVertical, PlayCircle, Pencil, Trash, Plus } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Song } from "@/types/song";
import { formatSongDuration } from "@/lib/utils";
import { usePlayerStore } from "@/store/playerStore";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

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
  const { setCurrentSong, addToQueue } = usePlayerStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePlay = () => {
    setCurrentSong(song);
  };

  const handleAddToQueue = () => {
    addToQueue(song);
    toast({
      title: "Şarkı kuyruğa eklendi",
      description: `${song.name} kuyruğa eklendi.`
    });
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songs: [song._id] }),
      });

      if (!response.ok) throw new Error('Şarkı eklenemedi');

      toast({
        title: "Başarılı",
        description: "Şarkı playlist'e eklendi",
      });

      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şarkı eklenirken bir hata oluştu",
      });
    }
  };

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
              onClick={handlePlay}
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
            <DropdownMenuItem onClick={handlePlay}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Çal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddToQueue}>
              <Plus className="mr-2 h-4 w-4" />
              Kuyruğa Ekle
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Plus className="mr-2 h-4 w-4" />
                Playlist'e Ekle
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {/* Playlist listesi burada olacak */}
                <DropdownMenuItem onClick={() => handleAddToPlaylist("playlist-id")}>
                  Playlist 1
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
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