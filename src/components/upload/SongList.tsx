import { useState, useRef, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
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

  const fetchSongs = async ({ pageParam = 1 }) => {
    const response = await fetch(
      `http://localhost:5000/api/songs?page=${pageParam}&limit=${ITEMS_PER_PAGE}`
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
  } = useInfiniteQuery({
    queryKey: ["songs"],
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
      
      // Invalidate and refetch
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

  return (
    <div className="space-y-4">
      <SongFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedGenre={selectedGenre}
        onGenreChange={setSelectedGenre}
        genres={["All", ...new Set(allSongs.map((song) => song.genre))].sort()}
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
              allSongs.map((song, index) => (
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