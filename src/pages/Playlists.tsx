import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PlaylistList } from "@/components/playlists/PlaylistList";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const Playlists = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: playlists, isLoading, error, refetch } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/playlists");
      if (!response.ok) {
        throw new Error("Playlist verileri alınamadı");
      }
      return response.json();
    },
  });

  const handlePlaylistUpdate = () => {
    refetch();
    toast({
      title: "Başarılı",
      description: "Playlist başarıyla güncellendi",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Playlist Yönetimi</h2>
        <Button onClick={() => navigate("/playlists/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Playlist
        </Button>
      </div>

      <PlaylistList 
        playlists={playlists || []} 
        onPlaylistUpdate={handlePlaylistUpdate}
      />
    </div>
  );
};

export default Playlists;