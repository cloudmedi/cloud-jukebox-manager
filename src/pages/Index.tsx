import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PlaylistCard } from "@/components/playlists/PlaylistCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music2 } from "lucide-react";

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

  return (
    <div className="space-y-8 p-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Music for Business
        </h1>
      </div>

      {/* Playlists Section */}
      {!playlists?.length ? (
        <div 
          className="flex flex-col items-center justify-center rounded-lg border bg-card p-8 text-center"
          role="alert"
          aria-label="Boş playlist listesi"
        >
          <Music2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Henüz playlist bulunmuyor</h3>
          <p className="text-sm text-muted-foreground">
            Sistem yöneticinizle iletişime geçin.
          </p>
        </div>
      ) : (
        <ScrollArea className="w-full" orientation="horizontal">
          <div className="flex space-x-4 pb-4 min-w-full">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist._id}
                playlist={playlist}
                onDelete={(id) => {
                  // Delete functionality
                  fetch(`http://localhost:5000/api/playlists/${id}`, {
                    method: "DELETE",
                  })
                    .then(response => {
                      if (!response.ok) {
                        throw new Error("Playlist silinemedi");
                      }
                      // Optionally, you can add a toast notification here
                    })
                    .catch(error => {
                      console.error("Error deleting playlist:", error);
                    });
                }}
                onEdit={(id) => navigate(`/playlists/${id}/edit`)}
                onPlay={(id) => {
                  const mainLayout = document.querySelector('.main-layout');
                  if (mainLayout) {
                    mainLayout.setAttribute('data-player-visible', 'true');
                  }
                }}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default Index;
