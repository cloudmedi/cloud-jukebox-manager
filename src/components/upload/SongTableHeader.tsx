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
}

export const SongTableHeader = ({ showCheckbox = false, allSongs = [] }: SongTableHeaderProps) => {
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
        <TableHead>Şarkı</TableHead>
        <TableHead>Sanatçı</TableHead>
        <TableHead>Tür</TableHead>
        <TableHead>Albüm</TableHead>
        <TableHead>Süre</TableHead>
        <TableHead>Eklenme Tarihi</TableHead>
        <TableHead className="w-[70px]"></TableHead>
      </TableRow>
    </TableHeader>
  );
};