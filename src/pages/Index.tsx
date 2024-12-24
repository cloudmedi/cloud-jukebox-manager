import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Music2, Send, Upload, Bell } from "lucide-react";
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
    <div className="space-y-6 p-4 md:p-6">
      {/* Hero Section - More compact */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 p-6">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Hoş Geldiniz
          </h1>
          <p className="text-muted-foreground mb-4">
            Playlistlerinizi yönetin ve cihazlara gönderin. Müzik koleksiyonunuzu organize edin.
          </p>
          <Button onClick={() => navigate("/playlists/new")} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Playlist
          </Button>
        </div>
        <div className="absolute right-0 top-0 w-1/4 h-full opacity-10">
          <Music2 className="w-full h-full" />
        </div>
      </div>

      {/* Recent Playlists Section - Compact Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            Son Playlistler
          </h2>
          <Button variant="ghost" onClick={() => navigate("/playlists")}>
            Tümünü Gör
          </Button>
        </div>

        {!playlists?.length ? (
          <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-6 text-center">
            <Music2 className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-base font-medium mb-2">Henüz playlist oluşturulmamış</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Yeni bir playlist oluşturmak için "Yeni Playlist" butonunu kullanın.
            </p>
            <Button onClick={() => navigate("/playlists/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Playlist Oluştur
            </Button>
          </div>
        ) : (
          <ScrollArea className="pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
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

      {/* Quick Actions Grid - More Compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Hızlı Gönderim */}
        <div className="group relative overflow-hidden rounded-lg border bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-purple-500/5 p-4 hover:shadow-md transition-all duration-300">
          <div className="relative z-10">
            <Send className="h-6 w-6 mb-3 text-blue-500" />
            <h3 className="font-semibold mb-1">Hızlı Gönderim</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Playlistleri tek tıkla cihazlara gönderin
            </p>
            <Button 
              variant="secondary" 
              className="w-full bg-white/10 hover:bg-white/20"
              onClick={() => navigate("/devices")}
            >
              Cihazları Yönet
            </Button>
          </div>
        </div>

        {/* Şarkı Yönetimi */}
        <div className="group relative overflow-hidden rounded-lg border bg-gradient-to-br from-green-500/5 via-green-500/10 to-emerald-500/5 p-4 hover:shadow-md transition-all duration-300">
          <div className="relative z-10">
            <Upload className="h-6 w-6 mb-3 text-green-500" />
            <h3 className="font-semibold mb-1">Şarkı Yönetimi</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Şarkılarınızı düzenleyin ve yenilerini ekleyin
            </p>
            <Button 
              variant="secondary" 
              className="w-full bg-white/10 hover:bg-white/20"
              onClick={() => navigate("/upload")}
            >
              Şarkıları Yönet
            </Button>
          </div>
        </div>

        {/* Anonslar */}
        <div className="group relative overflow-hidden rounded-lg border bg-gradient-to-br from-orange-500/5 via-orange-500/10 to-red-500/5 p-4 hover:shadow-md transition-all duration-300">
          <div className="relative z-10">
            <Bell className="h-6 w-6 mb-3 text-orange-500" />
            <h3 className="font-semibold mb-1">Anonslar</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Anonsları yönetin ve zamanlamalar oluşturun
            </p>
            <Button 
              variant="secondary" 
              className="w-full bg-white/10 hover:bg-white/20"
              onClick={() => navigate("/announcements")}
            >
              Anonsları Yönet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;