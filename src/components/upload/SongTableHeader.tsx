import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useSelectedSongsStore } from "@/store/selectedSongsStore";
import { Song } from "@/types/song";

interface SongTableHeaderProps {
  showCheckbox?: boolean;
  allSongs?: Song[];
  sortConfig?: {
    key: string;
    direction: string;
  };
  onSort?: (key: string) => void;
}

export const SongTableHeader = ({ 
  showCheckbox = false, 
  allSongs = [],
  sortConfig,
  onSort 
}: SongTableHeaderProps) => {
  const { selectedSongs, addSong, clearSelection } = useSelectedSongsStore();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      allSongs.forEach(song => addSong(song));
    } else {
      clearSelection();
    }
  };

  const isAllSelected = allSongs.length > 0 && selectedSongs.length === allSongs.length;

  return (
    <TableHeader>
      <TableRow>
        {showCheckbox && (
          <TableHead className="w-[50px]">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              aria-label="Tümünü seç"
            />
          </TableHead>
        )}
        <TableHead onClick={() => onSort?.('name')} className="cursor-pointer">Şarkı</TableHead>
        <TableHead onClick={() => onSort?.('artist')} className="cursor-pointer">Sanatçı</TableHead>
        <TableHead onClick={() => onSort?.('genre')} className="cursor-pointer">Tür</TableHead>
        <TableHead onClick={() => onSort?.('album')} className="cursor-pointer">Albüm</TableHead>
        <TableHead onClick={() => onSort?.('duration')} className="cursor-pointer">Süre</TableHead>
        <TableHead onClick={() => onSort?.('createdAt')} className="cursor-pointer">Eklenme Tarihi</TableHead>
        <TableHead className="w-[70px]"></TableHead>
      </TableRow>
    </TableHeader>
  );
};