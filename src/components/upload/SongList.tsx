import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody } from "@/components/ui/table";
import SongEditDialog from "./SongEditDialog";
import { Song } from "@/types/song";
import { SongTableHeader } from "./SongTableHeader";
import { SongTableRow } from "./SongTableRow";
import { SongFilters } from "./SongFilters";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SongResponse {
  songs: Song[];
  currentPage: number;
  totalPages: number;
  totalSongs: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const SongList = () => {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  const { data, isLoading, refetch } = useQuery<SongResponse>({
    queryKey: ["songs", currentPage, limit],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:5000/api/songs?page=${currentPage}&limit=${limit}`
      );
      if (!response.ok) throw new Error("Failed to fetch songs");
      return response.json();
    },
  });

  const genres = data?.songs ? ["All", ...new Set(data.songs.map((song) => song.genre))].sort() : ["All"];

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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-4">
      <SongFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedGenre={selectedGenre}
        onGenreChange={setSelectedGenre}
        genres={genres}
      />

      <div className="rounded-md border">
        <Table>
          <SongTableHeader />
          <TableBody>
            {data?.songs.map((song) => (
              <SongTableRow
                key={song._id}
                song={song}
                onEdit={setEditingSong}
                onDelete={handleDelete}
                allSongs={data.songs}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Toplam {data?.totalSongs} şarkı, Sayfa {data?.currentPage} / {data?.totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!data?.hasPrevPage}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Önceki
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!data?.hasNextPage}
          >
            Sonraki
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
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