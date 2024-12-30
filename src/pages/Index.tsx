import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Music2, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PlaylistCard } from "@/components/playlists/PlaylistCard";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#A3292E] to-[#C1444A] text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold">Chill Beats</h1>
              <p className="text-lg opacity-90 max-w-xl">
                Playlistlerinizi yönetin ve cihazlara gönderin. Müzik koleksiyonunuzu organize edin ve kontrol edin.
              </p>
              <Button 
                onClick={() => navigate("/playlists/new")} 
                size="lg" 
                className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90"
              >
                <Plus className="mr-2 h-5 w-5" />
                Yeni Playlist
              </Button>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-lg overflow-hidden bg-black/20 backdrop-blur">
                <Music2 className="w-full h-full p-12 opacity-50" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,0 C320,80 640,120 960,120 C1280,120 1440,80 1440,0 L1440,120 L0,120 Z" fill="white"/>
          </svg>
        </div>
      </div>

      <div className="container mx-auto px-4 space-y-12">
        {/* Search Bar */}
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              type="search" 
              placeholder="Playlist ara..." 
              className="pl-10 h-12 rounded-full"
            />
          </div>
        </div>

        {/* Playlists Section */}
        {!playlists?.length ? (
          <div 
            className="flex flex-col items-center justify-center rounded-lg border bg-card p-8 text-center"
            role="alert"
            aria-label="Boş playlist listesi"
          >
            <Music2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Henüz playlist oluşturulmamış</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Yeni bir playlist oluşturmak için "Yeni Playlist" butonunu kullanın.
            </p>
            <Button onClick={() => navigate("/playlists/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Playlist Oluştur
            </Button>
          </div>
        ) : (
          <>
            {/* Popular Today Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Popular Today</h2>
                  <p className="text-gray-600">En çok dinlenen playlistler</p>
                </div>
                <Button variant="ghost" onClick={() => navigate("/playlists")}>
                  Tümünü Gör
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {playlists.slice(0, 6).map((playlist) => (
                  <PlaylistCard
                    key={playlist._id}
                    playlist={playlist}
                    onDelete={(id) => {
                      toast({
                        title: "Playlist silindi",
                        description: "Playlist başarıyla silindi.",
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
            </div>

            {/* Cafe Channel Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Cafe Channel</h2>
                  <p className="text-gray-600">Kafeler için özel seçilmiş playlistler</p>
                </div>
                <Button variant="ghost" onClick={() => navigate("/playlists")}>
                  Tümünü Gör
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {playlists.slice(0, 3).map((playlist) => (
                  <PlaylistCard
                    key={playlist._id}
                    playlist={playlist}
                    onDelete={(id) => {
                      toast({
                        title: "Playlist silindi",
                        description: "Playlist başarıyla silindi.",
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;