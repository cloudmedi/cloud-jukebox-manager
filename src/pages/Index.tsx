import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlaylistCard } from "@/components/playlists/PlaylistCard";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

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

  // Playlistleri kategorilere ayır
  const categories = [
    {
      title: "Popüler Playlistler",
      playlists: playlists?.slice(0, 6) || [],
    },
    {
      title: "Son Eklenenler",
      playlists: playlists?.slice(6, 12) || [],
    },
    {
      title: "Önerilen Playlistler",
      playlists: playlists?.slice(12, 18) || [],
    },
  ];

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg bg-white border border-gray-200 p-8">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Müzik Koleksiyonunuzu Yönetin
          </h1>
          <p className="text-gray-600 mb-6">
            Playlistlerinizi düzenleyin, cihazlara gönderin ve müzik akışınızı kontrol edin.
          </p>
          <Button 
            onClick={() => navigate("/playlists/new")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Yeni Playlist Oluştur
          </Button>
        </div>
      </div>

      {/* Kategoriler */}
      {categories.map((category) => (
        <section key={category.title} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{category.title}</h2>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              Tümünü Gör
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="pb-4">
            <div className="flex gap-4">
              {category.playlists.map((playlist) => (
                <div key={playlist._id} className="w-[200px] flex-none">
                  <PlaylistCard
                    playlist={playlist}
                    onDelete={() => {}}
                    onEdit={(id) => navigate(`/playlists/${id}/edit`)}
                    onPlay={() => {
                      const mainLayout = document.querySelector('.main-layout');
                      if (mainLayout) {
                        mainLayout.setAttribute('data-player-visible', 'true');
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </section>
      ))}
    </div>
  );
};

export default Index;