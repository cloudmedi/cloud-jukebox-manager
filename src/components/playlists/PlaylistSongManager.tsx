import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

interface Song {
  _id: string;
  name: string;
  artist: string;
  duration: number;
}

interface Playlist {
  _id: string;
  name: string;
  songs: Song[];
}

interface PlaylistSongManagerProps {
  playlist: Playlist;
  onPlaylistUpdate: () => void;
}

export const PlaylistSongManager = ({ playlist, onPlaylistUpdate }: PlaylistSongManagerProps) => {
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const { toast } = useToast();

  const { data: availableSongs } = useQuery({
    queryKey: ["songs"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/songs");
      return response.json();
    },
  });

  const handleAddSong = async (songId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/playlists/${playlist._id}/songs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ songs: [songId] }),
      });

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

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

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
        {playlist.songs.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            Bu playlist'te henüz şarkı yok
          </div>
        ) : (
          <div className="space-y-1 p-4">
            {playlist.songs.map((song) => (
              <div
                key={song._id}
                className="flex items-center justify-between rounded-lg border p-2 hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon">
                    <Play className="h-4 w-4" />
                  </Button>
                  <div>
                    <p className="font-medium">{song.name}</p>
                    <p className="text-sm text-muted-foreground">{song.artist}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(song.duration)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSong(song._id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <Dialog open={isAddSongOpen} onOpenChange={setIsAddSongOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şarkı Ekle</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-1">
              {availableSongs?.map((song: Song) => (
                <div
                  key={song._id}
                  className="flex items-center justify-between rounded-lg border p-2 hover:bg-accent"
                >
                  <div>
                    <p className="font-medium">{song.name}</p>
                    <p className="text-sm text-muted-foreground">{song.artist}</p>
                  </div>
                  <Button onClick={() => handleAddSong(song._id)}>Ekle</Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};