import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { DeviceList } from "./send-dialog/DeviceList";
import { GroupList } from "./send-dialog/GroupList";
import { SearchInput } from "./send-dialog/SearchInput";
import { Progress } from "@/components/ui/progress";
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
  const [downloadProgress, setDownloadProgress] = useState<{[key: string]: number}>({});
  const [isDownloading, setIsDownloading] = useState(false);
  
  const form = useForm({
    defaultValues: {
      targetDevices: [],
      targetGroups: []
    }
  });

  const { data: playlistDetails } = useQuery({
    queryKey: ['playlist', playlist._id],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5000/api/playlists/${playlist._id}`);
      if (!response.ok) throw new Error("Playlist detayları alınamadı");
      return response.json();
    },
    enabled: isOpen
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

      setIsDownloading(true);
      const ws = new WebSocket('ws://localhost:5000/admin');
      
      ws.onopen = () => {
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
        
        switch (response.type) {
          case 'playlistSent':
            toast.success("Playlist başarıyla gönderildi");
            setIsDownloading(false);
            onClose();
            break;
            
          case 'error':
            toast.error(response.message || "Playlist gönderilemedi");
            setIsDownloading(false);
            break;
            
          case 'downloadProgress':
            setDownloadProgress(prev => ({
              ...prev,
              [response.deviceToken]: response.progress
            }));
            break;
            
          case 'deviceStatus':
            if (response.status === 'downloading') {
              toast.info(`${response.deviceName}: İndiriliyor... ${response.progress}%`);
            } else if (response.status === 'playing') {
              toast.success(`${response.deviceName}: Çalmaya başladı`);
            }
            break;
        }
      };

      ws.onerror = () => {
        toast.error("Bağlantı hatası oluştu");
        setIsDownloading(false);
      };
    } catch (error) {
      console.error("Gönderme hatası:", error);
      toast.error("Playlist gönderilirken bir hata oluştu");
      setIsDownloading(false);
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
                downloadProgress={downloadProgress}
                isDownloading={isDownloading}
              />
              <GroupList 
                searchQuery={searchQuery} 
                form={form} 
              />
            </div>
            
            {isDownloading && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">İndirme Durumu</p>
                {Object.entries(downloadProgress).map(([deviceToken, progress]) => (
                  <div key={deviceToken} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Cihaz {deviceToken}</span>
                      <span>%{progress}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isDownloading}
              >
                İptal
              </Button>
              <Button 
                type="submit"
                disabled={isDownloading}
              >
                {isDownloading ? 'Gönderiliyor...' : 'Gönder'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};