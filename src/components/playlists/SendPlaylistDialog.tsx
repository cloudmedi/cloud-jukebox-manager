import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
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
          type: 'playlist',
          action: 'send',
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
            toast.custom((t) => (
              <div className="bg-emerald-500 text-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="font-medium">Playlist Gönderildi!</h3>
                    <p className="text-sm opacity-90">"{playlist.name}" başarıyla gönderildi.</p>
                  </div>
                </div>
              </div>
            ), {
              duration: 4000
            });
            setIsDownloading(false);
            onClose();
            break;
            
          case 'error':
            toast.custom((t) => (
              <div className="bg-red-500 text-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="font-medium">Gönderme Başarısız!</h3>
                    <p className="text-sm opacity-90">{response.message || "Playlist gönderilemedi."}</p>
                  </div>
                </div>
              </div>
            ), {
              duration: 5000
            });
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
              toast.info(`${response.deviceName}: İndiriliyor... ${response.progress}%`, {
                duration: 2000,
                style: { background: '#3B82F6', color: 'white' }
              });
            } else if (response.status === 'playing') {
              toast.success(`${response.deviceName}: Çalmaya başladı`, {
                duration: 3000,
                style: { background: '#10B981', color: 'white' }
              });
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
    <Dialog open={isOpen} onOpenChange={() => !isDownloading && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white border-gray-200">
        <DialogHeader className="space-y-4">
          <div className="flex items-start gap-4">
            {playlistDetails?.artwork && (
              <div className="relative w-16 h-16 rounded-md overflow-hidden">
                <img 
                  src={`http://localhost:5000${playlistDetails.artwork}`}
                  alt={playlist.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            )}
            <div className="flex-1 space-y-1">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {playlist.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Seçilen cihaz ve gruplardaki tüm müzik sistemleri bu playlist'i otomatik olarak indirecek.
              </DialogDescription>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cihaz veya grup ara..."
              className="w-full h-10 bg-white border border-gray-200 rounded-lg pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all"
            />
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-6">
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
              <div className="space-y-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">İndirme Durumu</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {Object.values(downloadProgress).reduce((a, b) => a + b, 0) / Object.keys(downloadProgress).length}%
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.entries(downloadProgress).map(([deviceToken, progress]) => (
                    <div key={deviceToken} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-700">Cihaz {deviceToken}</span>
                        <span className="text-gray-500">%{progress}</span>
                      </div>
                      <Progress value={progress} className="h-1.5 bg-gray-200" indicatorClassName="bg-primary" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isDownloading}
                className="h-10 px-6 bg-white border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                İptal
              </Button>
              <Button 
                type="submit"
                disabled={isDownloading}
                className={`h-10 px-8 bg-primary text-white font-medium hover:bg-primary/90 transition-colors
                  ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isDownloading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white/90 rounded-full animate-spin" />
                    <span>Gönderiliyor...</span>
                  </div>
                ) : (
                  'Gönder'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
