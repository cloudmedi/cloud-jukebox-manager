import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PlaylistGrid } from "@/components/playlists/PlaylistGrid";
import { PlaylistList } from "@/components/playlists/PlaylistList";
import { useViewPreferencesStore } from "@/store/viewPreferencesStore";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isGridView, toggleView } = useViewPreferencesStore();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Playlistler</h2>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={toggleView}>
            {isGridView ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
          <Button onClick={() => navigate("/playlists/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Playlist
          </Button>
        </div>
      </div>

      {!playlists?.length ? (
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
      ) : (
        isGridView ? (
          <PlaylistGrid 
            playlists={playlists}
            onDelete={(id) => {
              toast({
                title: "Playlist silindi",
                description: "Playlist başarıyla silindi.",
              });
            }}
            onEdit={(id) => navigate(`/playlists/${id}/edit`)}
          />
        ) : (
          <PlaylistList 
            playlists={playlists}
            onDelete={(id) => {
              toast({
                title: "Playlist silindi",
                description: "Playlist başarıyla silindi.",
              });
            }}
            onEdit={(id) => navigate(`/playlists/${id}/edit`)}
          />
        )
      )}
    </div>
  );
};

export default Index;