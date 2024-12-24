import { useState } from "react";
import { Song } from "@/types/song";
import { SongTableHeader } from "./SongTableHeader";
import { SongTableRow } from "./SongTableRow";
import { Table, TableBody } from "@/components/ui/table";

interface SongListProps {
  songs: Song[];
  onDelete: (songId: string) => Promise<void>;
  onEdit?: (song: Song) => void;
  selectedSongs?: string[];
  onSelect?: (songId: string) => void;
}

const SongList = ({
  songs,
  onDelete,
  onEdit,
  selectedSongs = [],
  onSelect,
}: SongListProps) => {
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

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

  return (
    <div className="rounded-md border">
      <Table>
        <SongTableHeader
          showCheckbox={!!onSelect}
          allSongs={sortedSongs}
          sortConfig={sortConfig}
          onSort={handleSort}
        />
        <TableBody>
          {sortedSongs.map((song) => (
            <SongTableRow
              key={song._id}
              song={song}
              onDelete={onDelete}
              onEdit={onEdit}
              isSelected={selectedSongs.includes(song._id)}
              onSelect={onSelect}
              allSongs={sortedSongs}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SongList;