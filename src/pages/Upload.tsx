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
import { startOfDay, endOfDay, isWithinInterval } from "date-fns";

const Upload = () => {
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [durationRange, setDurationRange] = useState<[number, number]>([0, 10]);
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedAlbum, setSelectedAlbum] = useState("all");

  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  // Benzersiz dil ve albüm listelerini oluştur
  const languages = ["all", ...new Set(songs.map((song) => song.language || ""))].filter(Boolean);
  const albums = ["all", ...new Set(songs.map((song) => song.album || ""))].filter(Boolean);
  const genres = ["all", ...new Set(songs.map((song) => song.genre))];

  // Filtreleme işlemi
  const filteredSongs = songs.filter((song) => {
    const matchesSearch =
      song.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGenre = selectedGenre === "all" || song.genre === selectedGenre;
    
    const matchesLanguage = selectedLanguage === "all" || song.language === selectedLanguage;
    
    const matchesAlbum = selectedAlbum === "all" || song.album === selectedAlbum;
    
    const matchesDuration = 
      (song.duration / 60) >= durationRange[0] && 
      (song.duration / 60) <= durationRange[1];

    const matchesDateRange = !dateRange?.from || !dateRange?.to || (
      song.createdAt && isWithinInterval(new Date(song.createdAt), {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to || dateRange.from)
      })
    );

    return (
      matchesSearch &&
      matchesGenre &&
      matchesLanguage &&
      matchesAlbum &&
      matchesDuration &&
      matchesDateRange
    );
  });

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
        onUploadComplete={() => queryClient.invalidateQueries({ queryKey: ["songs"] })} 
      />
      
      <SongFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedGenre={selectedGenre}
        onGenreChange={setSelectedGenre}
        genres={genres}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        durationRange={durationRange}
        onDurationRangeChange={setDurationRange}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        languages={languages}
        selectedAlbum={selectedAlbum}
        onAlbumChange={setSelectedAlbum}
        albums={albums}
      />

      <SongList 
        songs={filteredSongs} 
        onDelete={handleDelete}
        onEdit={(song) => setEditingSong(song)}
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