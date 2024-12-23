import { useState } from "react";
import { Song } from "@/types/song";
import { SongTableHeader } from "./SongTableHeader";
import { SongTableRow } from "./SongTableRow";
import { Table, TableBody } from "@/components/ui/table";
import { useSelectedSongsStore } from "@/store/selectedSongsStore";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  const { selectedSongs, addSong, removeSong, clearSelection } = useSelectedSongsStore();

  const sortedSongs = [...songs].sort((a, b) => {
    if (!a[sortConfig.key] || !b[sortConfig.key]) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      sortedSongs.forEach(song => addSong(song));
    } else {
      clearSelection();
    }
  };

  const handleSelect = (song: Song, checked: boolean) => {
    if (checked) {
      addSong(song);
    } else {
      removeSong(song._id);
    }
  };

  const handleCreatePlaylist = () => {
    if (selectedSongs.length === 0) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen en az bir şarkı seçin",
      });
      return;
    }
    navigate("/playlists/new");
  };

  const handleBulkDelete = async () => {
    if (selectedSongs.length === 0) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen silmek için en az bir şarkı seçin",
      });
      return;
    }

    try {
      await Promise.all(selectedSongs.map(song => onDelete(song._id)));
      clearSelection();
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

  return (
    <div className="space-y-4">
      {selectedSongs.length > 0 && (
        <div className="flex items-center gap-4">
          <Button onClick={handleCreatePlaylist} variant="default">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Playlist Oluştur
          </Button>
          <Button onClick={handleBulkDelete} variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Seçilenleri Sil
          </Button>
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <SongTableHeader
            showCheckbox={true}
            allSongs={sortedSongs}
            sortConfig={sortConfig}
            onSort={handleSort}
            onSelectAll={handleSelectAll}
            selectedCount={selectedSongs.length}
          />
          <TableBody>
            {sortedSongs.map((song) => (
              <SongTableRow
                key={song._id}
                song={song}
                onDelete={onDelete}
                onEdit={onEdit}
                isSelected={selectedSongs.some(s => s._id === song._id)}
                onSelect={handleSelect}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SongList;