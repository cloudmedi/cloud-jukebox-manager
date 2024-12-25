import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Speaker, List, Volume2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PlaylistCard } from "@/components/playlists/PlaylistCard";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

  const quickActions = [
    {
      title: "Cihaz Yönetimi",
      description: "Cihazları görüntüle ve yönet",
      icon: Speaker,
      path: "/devices",
      color: "text-blue-500",
    },
    {
      title: "Playlist Oluştur",
      description: "Yeni bir playlist oluştur",
      icon: Plus,
      path: "/playlists/new",
      color: "text-green-500",
    },
    {
      title: "Anons Yönetimi",
      description: "Anonsları yönet",
      icon: Volume2,
      path: "/announcements",
      color: "text-orange-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col items-start space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Hoş Geldiniz
        </h1>
        <p className="text-muted-foreground">
          Cloud Media yönetim paneline hoş geldiniz. Aşağıdaki seçeneklerden birini seçerek başlayabilirsiniz.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Card
            key={action.path}
            className="group hover:shadow-md transition-all duration-300 cursor-pointer"
            onClick={() => navigate(action.path)}
          >
            <CardHeader>
              <div className="flex items-start space-x-4">
                <div className={`${action.color} p-2 rounded-lg bg-background`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <CardTitle>{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Recent Playlists */}
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
          <Card className="p-8 text-center">
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Henüz playlist oluşturulmamış
              </CardTitle>
              <CardDescription className="mt-2">
                Yeni bir playlist oluşturmak için "Playlist Oluştur" butonunu kullanın.
              </CardDescription>
            </CardHeader>
            <Button 
              onClick={() => navigate("/playlists/new")}
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Playlist Oluştur
            </Button>
          </Card>
        ) : (
          <ScrollArea className="h-[300px] rounded-md pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {playlists.slice(0, 8).map((playlist) => (
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
    </div>
  );
};

export default Index;