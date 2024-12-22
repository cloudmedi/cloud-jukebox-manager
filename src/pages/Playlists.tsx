import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlaylistList } from "@/components/playlists/PlaylistList";
import { PlaylistDialog } from "@/components/playlists/PlaylistDialog";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const Playlists = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const handlePlaylistUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ["playlists"] });
  };

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Playlist Yönetimi</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Playlist
        </Button>
      </div>

      <PlaylistList 
        playlists={playlists} 
        onPlaylistUpdate={handlePlaylistUpdate}
      />

      <PlaylistDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default Playlists;