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

    const response = await fetch(
      `http://localhost:5000/api/songs?${params.toString()}`
    );
    if (!response.ok) throw new Error("Failed to fetch songs");
    return response.json();
  };

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
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

  // Load more when scrolling to the bottom
  const loadMoreRef = useCallback((node: any) => {
    if (node !== null) {
      ref(node);
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, ref]);

  const allSongs = data?.pages.flatMap((page) => page.songs) ?? [];
  const uniqueGenres = ["All", ...new Set(allSongs.map((song) => song.genre))].sort();

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
            {isLoading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                <tr key={index}>
                  <td colSpan={7} className="p-2">
                    <Skeleton className="h-12 w-full" />
                  </td>
                </tr>
              ))
            ) : (
              allSongs.map((song) => (
                <SongTableRow
                  key={song._id}
                  song={song}
                  onEdit={setEditingSong}
                  onDelete={handleDelete}
                  allSongs={allSongs}
                />
              ))
            )}
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