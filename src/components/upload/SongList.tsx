import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const { selectedSongs, clearSelection } = useSelectedSongsStore();

  const { data: songs = [], isLoading, refetch } = useQuery({
    queryKey: ["songs"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/songs");
      if (!response.ok) throw new Error("Failed to fetch songs");
      return response.json() as Promise<Song[]>;
    },
  });

  const genres: string[] = Array.from(
    new Set(songs.map((song: Song) => song.genre))
  ).sort();
  const allGenres: string[] = ["All", ...genres];

  const filteredSongs = songs.filter((song: Song) => {
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

  const handleDeleteSelected = async () => {
    try {
      for (const song of selectedSongs) {
        await fetch(`http://localhost:5000/api/songs/${song._id}`, {
          method: "DELETE",
        });
      }
      
      toast({
        title: "Başarılı",
        description: "Seçili şarkılar silindi",
      });
      
      clearSelection();
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şarkılar silinirken bir hata oluştu",
      });
    }
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
          genres={allGenres}
        />
        {selectedSongs.length > 0 && (
          <div className="flex gap-2">
            <Button onClick={handleCreatePlaylist}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Playlist Oluştur ({selectedSongs.length})
            </Button>
            <Button variant="destructive" onClick={handleDeleteSelected}>
              <Trash2 className="mr-2 h-4 w-4" />
              Seçilenleri Sil
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <SongTableHeader showCheckbox={true} allSongs={filteredSongs} />
          <TableBody>
            {filteredSongs.map((song: Song) => (
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

      {editingSong && (
        <SongEditDialog
          song={editingSong}
          open={!!editingSong}
          onOpenChange={(open) => !open && setEditingSong(null)}
        />
      )}
    </div>
  );
};

export default SongList;