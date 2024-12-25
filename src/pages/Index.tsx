import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Music2, Speaker, Volume2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlaylistCard } from "@/components/playlists/PlaylistCard";
import { useToast } from "@/hooks/use-toast";

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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-grid-8" />
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6 animate-fade-in">
              Cloud Media Player
            </h1>
            <p className="text-xl text-blue-100 mb-8 animate-fade-in delay-100">
              Profesyonel müzik ve anons yönetim sisteminiz. Tüm mekanlarınızı tek bir platformdan yönetin.
            </p>
            <div className="flex gap-4 animate-fade-in delay-200">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate("/playlists/new")}
              >
                <Plus className="mr-2 h-5 w-5" />
                Yeni Playlist Oluştur
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Playlist Yönetimi */}
            <div className="group relative overflow-hidden rounded-lg bg-background p-8 shadow-lg transition-all hover:shadow-xl">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <Music2 className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Playlist Yönetimi</h3>
              <p className="mb-4 text-muted-foreground">
                Özelleştirilebilir playlistler oluşturun ve yönetin.
              </p>
              <Button 
                variant="ghost" 
                className="group-hover:text-blue-500"
                onClick={() => navigate("/playlists")}
              >
                Playlistleri Yönet
              </Button>
            </div>

            {/* Cihaz Yönetimi */}
            <div className="group relative overflow-hidden rounded-lg bg-background p-8 shadow-lg transition-all hover:shadow-xl">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                <Speaker className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Cihaz Yönetimi</h3>
              <p className="mb-4 text-muted-foreground">
                Tüm cihazlarınızı tek bir yerden kontrol edin.
              </p>
              <Button 
                variant="ghost"
                className="group-hover:text-green-500"
                onClick={() => navigate("/devices")}
              >
                Cihazları Yönet
              </Button>
            </div>

            {/* Anons Yönetimi */}
            <div className="group relative overflow-hidden rounded-lg bg-background p-8 shadow-lg transition-all hover:shadow-xl">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                <Volume2 className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Anons Yönetimi</h3>
              <p className="mb-4 text-muted-foreground">
                Zamanlı ve anlık anonslarınızı yönetin.
              </p>
              <Button 
                variant="ghost"
                className="group-hover:text-orange-500"
                onClick={() => navigate("/announcements")}
              >
                Anonsları Yönet
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Playlists */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Son Playlistler</h2>
            <Button variant="outline" onClick={() => navigate("/playlists")}>
              Tümünü Gör
            </Button>
          </div>

          <ScrollArea className="h-[400px] rounded-lg border bg-background p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {!playlists?.length ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <Music2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Henüz Playlist Yok</h3>
                  <p className="text-muted-foreground mb-4">
                    İlk playlistinizi oluşturarak başlayın
                  </p>
                  <Button onClick={() => navigate("/playlists/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Playlist Oluştur
                  </Button>
                </div>
              ) : (
                playlists.slice(0, 8).map((playlist) => (
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
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </section>
    </div>
  );
};

export default Index;