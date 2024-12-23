import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PlaylistCard } from "@/components/playlists/PlaylistCard";

const Index = () => {
  const navigate = useNavigate();

  const { data: playlists, isLoading } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/playlists");
      if (!response.ok) {
        throw new Error("Playlist verileri alınamadı");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!playlists?.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Ana Sayfa</h2>
          <Button onClick={() => navigate("/playlists/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Playlist
          </Button>
        </div>

        <div 
          className="flex h-[400px] items-center justify-center rounded-lg border bg-muted/5 text-center"
          role="alert"
          aria-label="Boş playlist listesi"
        >
          <div className="space-y-2 px-8">
            <h3 className="text-lg font-medium">Henüz playlist oluşturulmamış</h3>
            <p className="text-sm text-muted-foreground">
              Yeni bir playlist oluşturmak için yukarıdaki "Yeni Playlist" butonunu kullanın.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Ana Sayfa</h2>
        <Button onClick={() => navigate("/playlists/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Playlist
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {playlists.map((playlist) => (
          <PlaylistCard
            key={playlist._id}
            playlist={playlist}
          />
        ))}
      </div>
    </div>
  );
};

export default Index;