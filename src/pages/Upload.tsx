import { useState } from "react";
import SongList from "@/components/upload/SongList";
import SongUploader from "@/components/upload/SongUploader";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Song } from "@/types/song";
import SongEditDialog from "@/components/upload/SongEditDialog";
import { Loader2 } from "lucide-react";
import { SongFilters } from "@/components/upload/SongFilters";
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";

const Upload = () => {
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch songs with pagination
  const { data, isLoading } = useQuery({
    queryKey: ["songs", currentPage, itemsPerPage],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:5000/api/songs?page=${currentPage}&limit=${itemsPerPage}`
      );
      if (!response.ok) throw new Error("Failed to fetch songs");
      return response.json();
    },
  });

  const songs: Song[] = data?.songs || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  const handleDelete = async (songId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/songs/${songId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete song");
      }

      queryClient.invalidateQueries({ queryKey: ["songs"] });
      toast({
        title: "Başarılı",
        description: "Şarkı başarıyla silindi",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şarkı silinirken bir hata oluştu",
      });
    }
  };

  const filteredSongs = songs.filter((song: Song) => {
    const matchesSearch = song.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === "all" || song.genre === selectedGenre;
    
    let matchesDateRange = true;
    if (dateRange?.from && dateRange?.to && song.createdAt) {
      const songDate = parseISO(song.createdAt);
      matchesDateRange = isWithinInterval(songDate, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to)
      });
    }

    return matchesSearch && matchesGenre && matchesDateRange;
  });

  const uniqueGenres = Array.from(new Set(songs.map((song) => song.genre))) as string[];
  const genres = ["all", ...uniqueGenres];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Prefetch next page
    queryClient.prefetchQuery({
      queryKey: ["songs", page + 1, itemsPerPage],
      queryFn: async () => {
        const response = await fetch(
          `http://localhost:5000/api/songs?page=${page + 1}&limit=${itemsPerPage}`
        );
        if (!response.ok) throw new Error("Failed to fetch songs");
        return response.json();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Şarkı Yönetimi</h2>
        <p className="text-muted-foreground">
          Şarkılarınızı yükleyin ve yönetin
        </p>
      </div>

      <SongUploader 
        onUploadComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["songs"] });
          toast({
            title: "Başarılı",
            description: "Şarkı başarıyla yüklendi",
          });
        }} 
      />
      
      <SongFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedGenre={selectedGenre}
        onGenreChange={setSelectedGenre}
        genres={genres}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      <SongList 
        songs={filteredSongs} 
        onDelete={handleDelete}
        onEdit={(song) => setEditingSong(song)}
        currentPage={currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />

      <SongEditDialog
        song={editingSong}
        open={!!editingSong}
        onOpenChange={(open) => !open && setEditingSong(null)}
      />
    </div>
  );
};

export default Upload;