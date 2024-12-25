import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Music2, Speaker, Volume2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PlaylistCard } from "@/components/playlists/PlaylistCard";
import { useToast } from "@/hooks/use-toast";

const categories = [
  {
    id: 1,
    title: "Popular Today",
    description: "En çok tercih edilen playlistler",
  },
  {
    id: 2,
    title: "Seasonal Music",
    description: "Sezona özel müzik seçkileri",
  },
  {
    id: 3,
    title: "Top Charts",
    description: "En çok dinlenen şarkılardan oluşan listeler",
  },
  {
    id: 4,
    title: "Mood Based",
    description: "Farklı atmosferler için özel listeler",
  },
];

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

  // Playlistleri kategorilere böl (örnek olarak)
  const getPlaylistsByCategory = (categoryId: number) => {
    if (!playlists) return [];
    // Gerçek kategorilendirme mantığı burada uygulanabilir
    return playlists.slice(0, 6);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-blue-700 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6 animate-fade-in">
              Cloud Media Player
            </h1>
            <p className="text-xl text-blue-100 mb-8 animate-fade-in">
              Profesyonel müzik ve anons yönetim sisteminiz. Tüm mekanlarınızı tek platformdan yönetin.
            </p>
            <div className="flex gap-4 animate-fade-in">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate("/playlists/new")}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <Plus className="mr-2 h-5 w-5" />
                Yeni Playlist Oluştur
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories and Playlists */}
      <div className="container mx-auto px-4 py-16 space-y-16">
        {categories.map((category) => (
          <section key={category.id} className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{category.title}</h2>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
              <Button variant="ghost" onClick={() => navigate("/playlists")}>
                Tümünü Gör
              </Button>
            </div>
            
            <div className="relative">
              <ScrollArea>
                <div className="flex space-x-4 pb-4">
                  {getPlaylistsByCategory(category.id).map((playlist) => (
                    <div key={playlist._id} className="w-[250px] flex-none">
                      <PlaylistCard
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
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </section>
        ))}
      </div>

      {/* Quick Access Section */}
      <section className="container mx-auto px-4 py-16 border-t">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group relative overflow-hidden rounded-lg bg-card p-8 shadow-lg transition-all hover:shadow-xl">
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

          <div className="group relative overflow-hidden rounded-lg bg-card p-8 shadow-lg transition-all hover:shadow-xl">
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

          <div className="group relative overflow-hidden rounded-lg bg-card p-8 shadow-lg transition-all hover:shadow-xl">
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
      </section>
    </div>
  );
};

export default Index;