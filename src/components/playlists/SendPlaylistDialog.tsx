import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { DeviceList } from "./send-dialog/DeviceList";
import { GroupList } from "./send-dialog/GroupList";
import { SearchInput } from "./send-dialog/SearchInput";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface SendPlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: {
    _id: string;
    name: string;
  };
}

export const SendPlaylistDialog = ({ isOpen, onClose, playlist }: SendPlaylistDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const form = useForm({
    defaultValues: {
      targetDevices: [],
      targetGroups: []
    }
  });

  // Playlist detaylarını getir
  const { data: playlistDetails } = useQuery({
    queryKey: ['playlist', playlist._id],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5000/api/playlists/${playlist._id}`);
      if (!response.ok) throw new Error("Playlist detayları alınamadı");
      return response.json();
    },
    enabled: isOpen // Dialog açıkken çalışsın
  });

  const onSubmit = async (data: any) => {
    try {
      if (!data.targetDevices.length && !data.targetGroups.length) {
        toast.error("En az bir cihaz veya grup seçmelisiniz");
        return;
      }

      if (!playlistDetails) {
        toast.error("Playlist detayları yüklenemedi");
        return;
      }

      // WebSocket üzerinden playlist'i gönder
      const ws = new WebSocket('ws://localhost:5000/admin');
      
      ws.onopen = () => {
        // Tüm playlist detaylarını gönder
        ws.send(JSON.stringify({
          type: 'sendPlaylist',
          playlist: {
            _id: playlistDetails._id,
            name: playlistDetails.name,
            artwork: playlistDetails.artwork,
            songs: playlistDetails.songs.map((song: any) => ({
              _id: song._id,
              name: song.name,
              artist: song.artist,
              filePath: song.filePath,
              duration: song.duration
            }))
          },
          devices: data.targetDevices,
          groups: data.targetGroups
        }));

        toast.info("Playlist gönderiliyor...");
      };

      ws.onmessage = (event) => {
        const response = JSON.parse(event.data);
        if (response.type === 'playlistSent') {
          toast.success("Playlist başarıyla gönderildi");
          onClose();
        } else if (response.type === 'error') {
          toast.error(response.message || "Playlist gönderilemedi");
        } else if (response.type === 'downloadProgress') {
          // İndirme durumunu göster
          toast.info(`İndirme durumu: ${response.progress}%`);
        }
      };

      ws.onerror = () => {
        toast.error("Bağlantı hatası oluştu");
      };
    } catch (error) {
      console.error("Gönderme hatası:", error);
      toast.error("Playlist gönderilirken bir hata oluştu");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Playlist Gönder: {playlist.name}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <SearchInput value={searchQuery} onChange={setSearchQuery} />
            
            <div className="grid grid-cols-2 gap-4">
              <DeviceList 
                searchQuery={searchQuery} 
                form={form} 
              />
              <GroupList 
                searchQuery={searchQuery} 
                form={form} 
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                İptal
              </Button>
              <Button type="submit">
                Gönder
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};