import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PlaylistCard } from "@/components/playlists/PlaylistCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Music2 } from "lucide-react";
import { toast } from "sonner";
import websocketService from "@/services/websocketService";

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

  const handleSendToDevice = async (playlist: any) => {
    try {
      // WebSocket üzerinden playlist'i gönder
      websocketService.sendMessage({
        type: 'playlist',
        action: 'send',
        data: {
          _id: playlist._id,
          name: playlist.name,
          artwork: playlist.artwork,
          songs: playlist.songs.map((song: any) => ({
            _id: song._id,
            name: song.name,
            artist: song.artist,
            filePath: song.filePath,
            duration: song.duration
          }))
        }
      });
      
      toast.success("Playlist cihaza gönderiliyor");
    } catch (error) {
      console.error('Playlist gönderme hatası:', error);
      toast.error("Playlist gönderilemedi");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Music for Business
        </h1>
      </div>

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
        <ScrollArea className="w-full">
          <div className="flex space-x-4 pb-4">
            {playlists.map((playlist) => (
              <div key={playlist._id} className="w-[300px] flex-none">
                <PlaylistCard
                  playlist={playlist}
                  onDelete={(id) => {
                    fetch(`http://localhost:5000/api/playlists/${id}`, {
                      method: "DELETE",
                    })
                      .then(response => {
                        if (!response.ok) {
                          throw new Error("Playlist silinemedi");
                        }
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
                  onSendToDevice={() => handleSendToDevice(playlist)}
                />
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
};

export default Index;