import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Music2, PlayCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PlaylistCard } from "@/components/playlists/PlaylistCard";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="space-y-8 px-6 py-8">
      {/* Hero Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Hoş Geldiniz
          </h1>
          <p className="text-muted-foreground">
            Playlistlerinizi yönetin ve cihazlara gönderin
          </p>
        </div>
        <Button onClick={() => navigate("/playlists/new")} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Yeni Playlist
        </Button>
      </div>

      {/* Recent Playlists Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Son Playlistler
          </h2>
          <Button variant="ghost" onClick={() => navigate("/playlists")}>
            Tümünü Gör
          </Button>
        </div>

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
          <ScrollArea className="h-[400px] rounded-md">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {playlists.map((playlist) => (
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
                    // Show player in MainLayout
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border">
          <h3 className="font-semibold mb-2">Hızlı Gönderim</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Playlistleri tek tıkla cihazlara gönderin
          </p>
          <Button variant="secondary" className="w-full" onClick={() => navigate("/devices")}>
            Cihazları Yönet
          </Button>
        </div>
        
        <div className="p-6 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border">
          <h3 className="font-semibold mb-2">Şarkı Yönetimi</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Şarkılarınızı düzenleyin ve yenilerini ekleyin
          </p>
          <Button variant="secondary" className="w-full" onClick={() => navigate("/upload")}>
            Şarkıları Yönet
          </Button>
        </div>

        <div className="p-6 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 border">
          <h3 className="font-semibold mb-2">Anonslar</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Anonsları yönetin ve zamanlamalar oluşturun
          </p>
          <Button variant="secondary" className="w-full" onClick={() => navigate("/announcements")}>
            Anonsları Yönet
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;