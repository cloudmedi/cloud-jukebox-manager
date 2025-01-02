import React from 'react';
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Download, Pause, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DownloadProgress {
  deviceId: string;
  playlistId: string;
  songId: string;
  status: 'downloading' | 'paused' | 'completed' | 'error';
  progress: number;
  currentChunk: number;
  totalChunks: number;
  speed: number;
}

export const DeviceDownloadProgress = ({ deviceId }: { deviceId: string }) => {
  const { data: downloads } = useQuery({
    queryKey: ['device-downloads', deviceId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5000/api/devices/${deviceId}/downloads`);
      if (!response.ok) {
        throw new Error('İndirme bilgileri alınamadı');
      }
      return response.json();
    }
  });

  // WebSocket üzerinden gelen güncellemeleri dinle
  React.useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000/admin');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'downloadProgress' && data.data.deviceId === deviceId) {
        // React Query cache'ini güncelle
        queryClient.setQueryData(['device-downloads', deviceId], (old: any) => {
          return old ? [...old, data.data] : [data.data];
        });

        // İndirme tamamlandığında bildirim göster
        if (data.data.status === 'completed') {
          toast({
            title: "İndirme Tamamlandı",
            description: "Playlist başarıyla indirildi.",
          });
        }
      }
    };

    return () => ws.close();
  }, [deviceId]);

  if (!downloads || downloads.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {downloads.map((download: DownloadProgress) => (
        <div key={download.songId} className="bg-card rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {download.status === 'downloading' && <Download className="h-4 w-4 animate-pulse text-blue-500" />}
              {download.status === 'paused' && <Pause className="h-4 w-4 text-yellow-500" />}
              {download.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
              <span className="text-sm font-medium">Playlist İndiriliyor</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {download.currentChunk}/{download.totalChunks} chunks
            </span>
          </div>
          
          <Progress value={download.progress} className="h-2" />
          
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{download.progress.toFixed(1)}%</span>
            <span>{(download.speed / 1024 / 1024).toFixed(2)} MB/s</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeviceDownloadProgress;