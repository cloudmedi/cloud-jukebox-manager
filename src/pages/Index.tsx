import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Music2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import PlaylistCard from "@/components/playlists/PlaylistCard";
import { PlaylistCardSkeleton } from "@/components/playlists/PlaylistCardSkeleton";
import { HeroSkeleton } from "@/components/hero/HeroSkeleton";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: playlists, isLoading } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/playlists");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
  });

  // Loading skeletons array
  const skeletons = Array.from({ length: 12 }, (_, i) => (
    <PlaylistCardSkeleton key={`skeleton-${i}`} />
  ));

  return (
    <div className="space-y-8 p-6">
      {/* Hero Section */}
      {isLoading ? (
        <HeroSkeleton />
      ) : (
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-600/20 via-indigo-500/20 to-blue-500/20 p-12 mb-8">
          <div className="relative z-10 max-w-4xl">
            <h1 className="text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
              İşletmenizin Müzik Deneyimi
            </h1>
            <p className="text-2xl text-muted-foreground/90 max-w-2xl leading-relaxed">
              Mekanınızın atmosferini mükemmel müzikle tamamlayın. 
              <span className="block mt-2 text-xl opacity-80">
                Profesyonel ses yönetimi artık parmaklarınızın ucunda.
              </span>
            </p>
          </div>
          <div className="absolute right-0 top-0 w-1/2 h-full opacity-10">
            <div className="absolute inset-0 bg-gradient-to-l from-background to-transparent" />
            <Music2 className="w-full h-full" />
          </div>
        </div>
      )}

      {/* Playlists Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Playlistler
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
            {skeletons}
          </div>
        ) : !playlists?.length ? (
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
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
        )}
      </div>
    </div>
  );
};

export default Index;