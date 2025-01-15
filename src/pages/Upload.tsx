import { useState, useEffect } from "react";
import SongList from "@/components/upload/SongList";
import SongUploader from "@/components/upload/SongUploader";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Song } from "@/types/song";
import SongEditDialog from "@/components/upload/SongEditDialog";
import { Loader2 } from "lucide-react";
import { SongFilters } from "@/components/upload/SongFilters";
import { UploadDateRangeSelect } from "@/components/upload/UploadDateRangeSelect";
import { isWithinInterval, parseISO, startOfDay, endOfDay, subDays, subMonths, isAfter } from "date-fns";
import { useInView } from 'react-intersection-observer';
import { TimeFilter } from "@/types/timeFilter";

const ITEMS_PER_PAGE = 20;

const Upload = () => {
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [displayedItems, setDisplayedItems] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayMode, setDisplayMode] = useState<'infinite' | 'all'>('infinite');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  const { data: songs = [], isLoading } = useQuery<Song[]>({
    queryKey: ["songs"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/songs");
      if (!response.ok) throw new Error("Failed to fetch songs");
      return response.json();
    },
  });

  const handleDelete = async (songId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/songs/${songId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete song");
      }

      queryClient.invalidateQueries({ queryKey: ["songs"] });
    } catch (error) {
      console.error('Error deleting song:', error);
      throw error;
    }
  };

  // Zaman filtresi için yardımcı fonksiyon
  const getTimeFilteredSongs = (songs: Song[], filter: TimeFilter) => {
    const now = new Date();
    const today = startOfDay(now);
    const weekAgo = subDays(today, 7);
    const monthAgo = subMonths(today, 1);

    switch (filter) {
      case 'latest':
        // En son yüklenenleri tarih sırasına göre getir
        return [...songs].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'today':
        return songs.filter(song => 
          isAfter(parseISO(song.createdAt), today)
        );
      case 'week':
        return songs.filter(song => 
          isAfter(parseISO(song.createdAt), weekAgo)
        );
      case 'month':
        return songs.filter(song => 
          isAfter(parseISO(song.createdAt), monthAgo)
        );
      default:
        return songs;
    }
  };

  // Filtreleme işlemi
  const filteredSongs = songs.filter((song) => {
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

  // Zaman filtresini uygula
  const timeFilteredSongs = getTimeFilteredSongs(filteredSongs, timeFilter);

  // Filtre veya tür değiştiğinde display modunu güncelle
  useEffect(() => {
    if (selectedGenre !== 'all' || searchTerm || timeFilter !== 'all' || (dateRange?.from && dateRange?.to)) {
      // Filtre aktif, tümünü göster
      setDisplayMode('all');
      setDisplayedItems(timeFilteredSongs.length);
    } else {
      // Normal mod, sonsuz scroll aktif
      setDisplayMode('infinite');
      setDisplayedItems(ITEMS_PER_PAGE);
    }
  }, [selectedGenre, searchTerm, timeFilter, dateRange, timeFilteredSongs.length]);

  // Sayfalama için slice
  const paginatedSongs = timeFilteredSongs.slice(0, displayedItems);
  const hasMore = timeFilteredSongs.length > displayedItems;

  // Intersection Observer ile scroll kontrolü - sadece infinite modda çalışır
  useEffect(() => {
    if (displayMode === 'infinite' && inView && hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setDisplayedItems(prev => prev + ITEMS_PER_PAGE);
        setIsLoadingMore(false);
      }, 300);
    }
  }, [inView, hasMore, isLoadingMore, displayMode]);

  const genres = ["all", ...new Set(songs.map(song => song.genre))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="space-y-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Şarkılar yükleniyor...</p>
        </div>
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
          if (displayMode === 'infinite') {
            setDisplayedItems(ITEMS_PER_PAGE);
          }
        }} 
      />
      
      <SongFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedGenre={selectedGenre}
        onGenreChange={setSelectedGenre}
        genres={genres}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
      />

      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <UploadDateRangeSelect
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
      </div>

      <div className="space-y-4">
        <SongList 
          songs={paginatedSongs}
          onDelete={handleDelete}
          onEdit={(song) => setEditingSong(song)}
        />

        {displayMode === 'infinite' && hasMore && (
          <div 
            ref={loadMoreRef}
            className="py-4 flex justify-center"
          >
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && timeFilteredSongs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Şarkı bulunamadı
          </div>
        )}
      </div>

      <SongEditDialog
        song={editingSong}
        open={!!editingSong}
        onOpenChange={(open) => !open && setEditingSong(null)}
      />
    </div>
  );
};

export default Upload;