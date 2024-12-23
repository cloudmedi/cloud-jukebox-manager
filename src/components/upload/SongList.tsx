import { useState } from "react";
import { Song } from "@/types/song";
import { SongTableHeader } from "./SongTableHeader";
import { SongTableRow } from "./SongTableRow";
import { Table, TableBody } from "@/components/ui/table";
import { useSelectedSongsStore } from "@/store/selectedSongsStore";

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

  return (
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
  );
};

export default SongList;