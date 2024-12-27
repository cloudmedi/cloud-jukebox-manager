import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical, Clock, Music, PlayCircle, Pencil, Trash2, Plus } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { Song } from "@/types/song";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SongListProps {
  songs: Song[];
  onDelete: (songId: string) => Promise<void>;
  onEdit?: (song: Song) => void;
}

const SongList = ({
  songs,
  onDelete,
  onEdit,
}: SongListProps) => {
  const { toast } = useToast();
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);

  const handleDelete = async (songId: string) => {
    try {
      await onDelete(songId);
      toast({
        title: "Başarılı",
        description: "Şarkı başarıyla silindi",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şarkı silinirken bir hata oluştu",
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSongs(songs.map(song => song._id));
    } else {
      setSelectedSongs([]);
    }
  };

  const handleSelectSong = (songId: string, checked: boolean) => {
    if (checked) {
      setSelectedSongs([...selectedSongs, songId]);
    } else {
      setSelectedSongs(selectedSongs.filter(id => id !== songId));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedSongs.map(songId => onDelete(songId)));
      setSelectedSongs([]);
      toast({
        title: "Başarılı",
        description: "Seçili şarkılar başarıyla silindi",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şarkılar silinirken bir hata oluştu",
      });
    }
  };

  const handleAddToPlaylist = () => {
    // Playlist ekleme işlemi
    toast({
      title: "Playlist'e Eklendi",
      description: "Seçili şarkılar playlist'e eklendi",
    });
  };

  if (songs.length === 0) {
    return (
      <div className="text-center py-10">
        <Music className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Şarkı bulunamadı</h3>
        <p className="mt-1 text-sm text-gray-500">Henüz hiç şarkı yüklenmemiş.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedSongs.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedSongs.length} şarkı seçildi
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddToPlaylist}
          >
            <Plus className="h-4 w-4 mr-2" />
            Playlist'e Ekle
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Seçilenleri Sil
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedSongs.length === songs.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Tümünü seç"
                />
              </TableHead>
              <TableHead>Şarkı</TableHead>
              <TableHead>Sanatçı</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Albüm</TableHead>
              <TableHead>Süre</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {songs.map((song) => (
              <TableRow key={song._id}>
                <TableCell>
                  <Checkbox
                    checked={selectedSongs.includes(song._id)}
                    onCheckedChange={(checked) => handleSelectSong(song._id, checked as boolean)}
                    aria-label={`${song.name} seç`}
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
                          />
                        ) : (
                          <Music className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <button className="absolute inset-0 bg-black/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDuration(song.duration)}</span>
                  </div>
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
                        onClick={() => handleDelete(song._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SongList;