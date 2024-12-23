import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Music } from "lucide-react";

interface BulkPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceIds: string[];
  onSuccess: () => void;
}

export const BulkPlaylistDialog = ({
  open,
  onOpenChange,
  deviceIds,
  onSuccess,
}: BulkPlaylistDialogProps) => {
  const { data: playlists, isLoading } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/playlists");
      if (!response.ok) throw new Error("Playlistler yüklenemedi");
      return response.json();
    },
    enabled: open,
  });

  const handleSelectPlaylist = async (playlistId: string) => {
    try {
      const response = await fetch("http://localhost:5000/api/devices/bulk/playlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceIds,
          playlistId,
        }),
      });

      if (!response.ok) {
        throw new Error("Playlist atanamadı");
      }

      toast.success("Playlist başarıyla atandı");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("İşlem başarısız oldu");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Playlist Seç</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {playlists?.map((playlist: any) => (
                <button
                  key={playlist._id}
                  onClick={() => handleSelectPlaylist(playlist._id)}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                    <Music className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{playlist.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {playlist.songs?.length || 0} şarkı
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};