import { useState, useCallback } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody } from "@/components/ui/table";
import SongEditDialog from "./SongEditDialog";
import { Song } from "@/types/song";
import { SongTableHeader } from "./SongTableHeader";
import { SongTableRow } from "./SongTableRow";
import { SongFilters } from "./SongFilters";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useInView } from "react-intersection-observer";

const ITEMS_PER_PAGE = 20;

const SongList = () => {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const { toast } = useToast();
  const { ref, inView } = useInView();
  const queryClient = useQueryClient();

  const fetchSongs = async ({ pageParam = 1 }) => {
    try {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }
      if (selectedGenre !== "All") {
        params.append("genre", selectedGenre);
      }

      console.log("Fetching songs with params:", params.toString());

      const response = await fetch(
        `http://localhost:5000/api/songs?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch songs");
      }
      
      const data = await response.json();
      console.log("Fetched songs data:", data);
      return data;
    } catch (error) {
      console.error("Error fetching songs:", error);
      throw error;
    }
  };

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    error
  } = useInfiniteQuery({
    queryKey: ["songs", searchTerm, selectedGenre],
    queryFn: fetchSongs,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
    initialPageParam: 1,
  });

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

  const loadMoreRef = useCallback((node: any) => {
    if (node !== null) {
      ref(node);
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, ref]);

  // Safely get the songs array
  const allSongs = data?.pages?.flatMap((page) => page.songs || []) ?? [];
  
  // Safely calculate unique genres
  const uniqueGenres = ["All"];
  if (allSongs && allSongs.length > 0) {
    const genres = new Set(allSongs.filter(song => song && song.genre).map(song => song.genre));
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
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
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

  if (allSongs.length === 0) {
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
        onSearchChange={(value) => {
          setSearchTerm(value);
          refetch();
        }}
        selectedGenre={selectedGenre}
        onGenreChange={(value) => {
          setSelectedGenre(value);
          refetch();
        }}
        genres={uniqueGenres}
      />

      <div className="rounded-md border">
        <Table>
          <SongTableHeader />
          <TableBody>
            {allSongs.map((song) => (
              song && <SongTableRow
                key={song._id}
                song={song}
                onEdit={setEditingSong}
                onDelete={handleDelete}
                allSongs={allSongs}
              />
            ))}
          </TableBody>
        </Table>

        {/* Infinite scroll trigger */}
        <div
          ref={loadMoreRef}
          className="h-20 flex items-center justify-center"
        >
          {isFetchingNextPage && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          )}
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