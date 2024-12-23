import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SongEditDialog from "./SongEditDialog";
import { Song } from "@/types/song";
import { SongTableHeader } from "./SongTableHeader";
import { SongTableRow } from "./SongTableRow";
import { SongFilters } from "./SongFilters";
import { useSelectedSongsStore } from "@/store/selectedSongsStore";

const SongList = () => {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const navigate = useNavigate();
  const { selectedSongs, clearSelection } = useSelectedSongsStore();

  const { data: songs = [], isLoading, refetch } = useQuery<Song[]>({
    queryKey: ["songs"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/songs");
      if (!response.ok) throw new Error("Failed to fetch songs");
      return response.json();
    },
  });

  const genres = ["All", ...new Set(songs.map((song) => song.genre))].sort();

  const filteredSongs = songs?.filter((song) => {
    const matchesGenre = selectedGenre === "All" || song.genre === selectedGenre;
    const matchesSearch =
      song.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/songs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete song");
      refetch();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleCreatePlaylist = () => {
    navigate("/playlists/new");
  };

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SongFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
          genres={genres}
        />
        {selectedSongs.length > 0 && (
          <Button onClick={handleCreatePlaylist}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Playlist Oluştur ({selectedSongs.length})
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <SongTableHeader showCheckbox={true} />
          <TableBody>
            {filteredSongs?.map((song) => (
              <SongTableRow
                key={song._id}
                song={song}
                onEdit={setEditingSong}
                onDelete={handleDelete}
                allSongs={filteredSongs}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <SongEditDialog
        song={editingSong}
        open={!!editingSong}
        onOpenChange={(open) => !open && setEditingSong(null)}
      />
    </div>
  );
};

export default SongList;