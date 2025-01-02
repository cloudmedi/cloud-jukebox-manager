import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

export const handleDownloadProgress = (message: any) => {
  console.log('Handling download progress:', message);

  // Update device data in React Query cache
  queryClient.setQueryData(['devices'], (oldData: any) => {
    if (!oldData) return oldData;

    return oldData.map((device: any) => {
      if (device.token === message.token) {
        const updatedDevice = {
          ...device,
          downloadProgress: message.progress,
          downloadSpeed: message.downloadSpeed,
          downloadedSongs: message.downloadedSongs,
          totalSongs: message.totalSongs,
          estimatedTimeRemaining: message.estimatedTimeRemaining,
          playlistStatus: message.status,
        };

        // Show notifications based on status and progress
        if (message.status === 'error') {
          toast.error(`İndirme hatası: ${message.lastError}`);
        } else if (message.status === 'completed') {
          toast.success('Playlist başarıyla indirildi');
        } else if (message.downloadedSongs > device.downloadedSongs) {
          // Show notification when a new song is completed
          toast.success(`${message.downloadedSongs}. şarkı indirildi`);
        }

        return updatedDevice;
      }
      return device;
    });
  });

  // Force a refetch to ensure UI is updated
  queryClient.invalidateQueries({ queryKey: ['devices'] });
};