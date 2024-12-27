import { useState, useCallback, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Song } from "@/types/song";
import { SongTableHeader } from "./SongTableHeader";
import { SongTableRow } from "./SongTableRow";
import { Table, TableBody } from "@/components/ui/table";
import { useSelectedSongsStore } from "@/store/selectedSongsStore";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface SongListProps {
  songs: Song[];
  onDelete: (songId: string) => Promise<void>;
  onEdit?: (song: Song) => void;
}

const SongList = ({ songs, onDelete, onEdit }: SongListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  const { selectedSongs, addSong, removeSong, clearSelection } = useSelectedSongsStore();

  // Performans optimizasyonu için useMemo ile sıralama
  const sortedSongs = useMemo(() => {
    return [...songs].sort((a, b) => {
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
  }, [songs, sortConfig]);

  // Virtual scroll için container ref
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtualization implementasyonu
  const rowVirtualizer = useVirtualizer({
    count: sortedSongs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Her satırın yaklaşık yüksekliği
    overscan: 5, // Ekstra render edilecek öğe sayısı
  });

  const handleSort = useCallback((key: string) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      sortedSongs.forEach(song => addSong(song));
    } else {
      clearSelection();
    }
  }, [sortedSongs, addSong, clearSelection]);

  const handleSelect = useCallback((song: Song, checked: boolean) => {
    if (checked) {
      addSong(song);
    } else {
      removeSong(song._id);
    }
  }, [addSong, removeSong]);

  const handleCreatePlaylist = useCallback(() => {
    if (selectedSongs.length === 0) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen en az bir şarkı seçin",
      });
      return;
    }
    navigate("/playlists/new");
  }, [selectedSongs.length, navigate, toast]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedSongs.length === 0) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen silmek için en az bir şarkı seçin",
      });
      return;
    }

    try {
      setIsDeleting(true);
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
    } finally {
      setIsDeleting(false);
    }
  }, [selectedSongs, onDelete, clearSelection, toast]);

  return (
    <div className="space-y-4">
      {selectedSongs.length > 0 && (
        <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {selectedSongs.length} şarkı seçildi
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCreatePlaylist}
              variant="default"
              disabled={isDeleting}
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Playlist Oluştur
            </Button>
            <Button
              onClick={handleBulkDelete}
              variant="destructive"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {isDeleting ? "Siliniyor..." : "Seçilenleri Sil"}
            </Button>
          </div>
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
            <div
              ref={parentRef}
              style={{
                height: '400px',
                overflow: 'auto',
              }}
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const song = sortedSongs[virtualRow.index];
                  return (
                    <div
                      key={song._id}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <SongTableRow
                        song={song}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        isSelected={selectedSongs.some(s => s._id === song._id)}
                        onSelect={handleSelect}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SongList;