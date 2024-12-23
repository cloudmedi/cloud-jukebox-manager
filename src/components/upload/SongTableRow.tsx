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
import { formatDuration } from "@/lib/utils";
import { usePlaybackStore } from "@/store/playbackStore";
import { usePlayer } from "@/components/layout/MainLayout";
import { useSelectedSongsStore } from "@/store/selectedSongsStore";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface SongTableRowProps {
  song: Song;
  onEdit: (song: Song) => void;
  onDelete: (id: string) => Promise<void>;
  allSongs: Song[];
}

export const SongTableRow = ({ song, onEdit, onDelete, allSongs }: SongTableRowProps) => {
  const { setCurrentSong, setQueue } = usePlaybackStore();
  const { setShowPlayer } = usePlayer();
  const { addSong, removeSong, isSelected } = useSelectedSongsStore();
  const { toast } = useToast();

  // Fetch playlists
  const { data: playlists = [] } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/playlists");
      if (!response.ok) throw new Error("Failed to fetch playlists");
      return response.json();
    },
  });

  const handlePlay = () => {
    setQueue(allSongs);
    setCurrentSong(song);
    setShowPlayer(true);
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (checked) {
      addSong(song);
    } else {
      removeSong(song._id);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/playlists/${playlistId}/songs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ songs: [song._id] }),
      });

      if (!response.ok) throw new Error("Failed to add song to playlist");

      toast({
        title: "Başarılı",
        description: "Şarkı playliste eklendi",
      });
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
          checked={isSelected(song._id)}
          onCheckedChange={handleCheckboxChange}
          className="mr-2"
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
            <div className="absolute inset-0 bg-black/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="absolute inset-0 w-full h-full text-white hover:text-white hover:bg-white/20"
                onClick={handlePlay}
              >
                <PlayCircle className="h-6 w-6" />
              </Button>
            </div>
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
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handlePlay}>
              Oynat
            </DropdownMenuItem>
            {playlists.length > 0 && (
              <>
                <DropdownMenuItem className="p-0">
                  <div className="w-full px-2 py-1.5 text-sm">
                    <div className="font-medium mb-1">Playliste Ekle</div>
                    <div className="space-y-1">
                      {playlists.map((playlist: any) => (
                        <div
                          key={playlist._id}
                          onClick={() => handleAddToPlaylist(playlist._id)}
                          className="px-2 py-1 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                        >
                          {playlist.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={() => onEdit(song)}>
              Düzenle
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(song._id)}
            >
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};