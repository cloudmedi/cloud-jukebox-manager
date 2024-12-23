import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody } from "@/components/ui/table";
import SongEditDialog from "./SongEditDialog";
import { Song } from "@/types/song";
import { SongTableHeader } from "./SongTableHeader";
import { SongTableRow } from "./SongTableRow";
import { SongFilters } from "./SongFilters";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const SongList = () => {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: songsResponse, isLoading, error } = useQuery({
    queryKey: ["songs", searchTerm, selectedGenre],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        if (selectedGenre !== "All") params.append("genre", selectedGenre);

        console.log("Fetching songs with params:", params.toString());
        const response = await fetch(`http://localhost:5000/api/songs?${params.toString()}`);
        
        if (!response.ok) throw new Error("Failed to fetch songs");
        const data = await response.json();
        console.log("Fetched songs data:", data);
        return data;
      } catch (error) {
        console.error("Error fetching songs:", error);
        throw error;
      }
    }
  });

  const songs = songsResponse?.songs || [];

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/songs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete song");
      
      toast({
        title: "Başarılı",
        description: "Şarkı başarıyla silindi",
      });
      
      queryClient.invalidateQueries({ queryKey: ["songs"] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şarkı silinirken bir hata oluştu",
      });
    }
  };

  const uniqueGenres = ["All"];
  if (songs && songs.length > 0) {
    const genres = new Set(songs.filter(song => song && song.genre).map(song => song.genre));
    uniqueGenres.push(...Array.from(genres).sort());
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Şarkılar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SongFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
          genres={["All"]}
        />
        <div className="rounded-md border">
          <Table>
            <SongTableHeader />
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan={7} className="p-2">
                    <Skeleton className="h-12 w-full" />
                  </td>
                </tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (!songs || songs.length === 0) {
    return (
      <div className="space-y-4">
        <SongFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
          genres={uniqueGenres}
        />
        <div className="text-center py-8 text-muted-foreground">
          Henüz hiç şarkı yüklenmemiş veya arama kriterlerine uygun şarkı bulunamadı.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SongFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedGenre={selectedGenre}
        onGenreChange={setSelectedGenre}
        genres={uniqueGenres}
      />

      <div className="rounded-md border">
        <Table>
          <SongTableHeader />
          <TableBody>
            {songs.map((song: Song) => (
              <SongTableRow
                key={song._id}
                song={song}
                onEdit={setEditingSong}
                onDelete={handleDelete}
                allSongs={songs}
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