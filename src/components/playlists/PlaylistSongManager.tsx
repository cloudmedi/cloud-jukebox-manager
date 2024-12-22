import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SongList } from "./SongList";
import { AddSongDialog } from "./AddSongDialog";
import { SongSkeleton } from "./SongSkeleton";
import { Song } from "@/types/song";

interface Playlist {
  _id: string;
  name: string;
  songs: Song[];
}

interface PlaylistSongManagerProps {
  playlist: Playlist;
  onPlaylistUpdate: () => void;
}

export const PlaylistSongManager = ({
  playlist,
  onPlaylistUpdate,
}: PlaylistSongManagerProps) => {
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const { toast } = useToast();

  const {
    data: availableSongs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["songs"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/songs");
      if (!response.ok) {
        throw new Error("Şarkılar yüklenirken bir hata oluştu");
      }
      return response.json();
    },
  });

  const handleAddSong = async (songId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/playlists/${playlist._id}/songs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ songs: [songId] }),
        }
      );

      if (!response.ok) throw new Error("Şarkı eklenemedi");

      toast({
        title: "Başarılı",
        description: "Şarkı playlist'e eklendi",
      });

      onPlaylistUpdate();
      setIsAddSongOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şarkı eklenirken bir hata oluştu",
      });
    }
  };

  const handleRemoveSong = async (songId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/playlists/${playlist._id}/songs/${songId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Şarkı silinemedi");

      toast({
        title: "Başarılı",
        description: "Şarkı playlist'ten kaldırıldı",
      });

      onPlaylistUpdate();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şarkı kaldırılırken bir hata oluştu",
      });
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>
          Şarkılar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Şarkılar</h3>
        <Button onClick={() => setIsAddSongOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Şarkı Ekle
        </Button>
      </div>

      <ScrollArea className="h-[300px] rounded-md border">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => (
              <SongSkeleton key={i} />
            ))}
          </div>
        ) : (
          <SongList
            songs={playlist.songs}
            onRemove={handleRemoveSong}
            isLoading={isLoading}
          />
        )}
      </ScrollArea>

      <AddSongDialog
        open={isAddSongOpen}
        onOpenChange={setIsAddSongOpen}
        availableSongs={availableSongs}
        isLoading={isLoading}
        error={error as Error}
        onAddSong={handleAddSong}
      />
    </div>
  );
};