import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Singleton QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

export const handleDownloadProgress = (message: any) => {
  console.log('Handling download progress:', message);

  const { payload } = message;
  
  // Update device data in React Query cache
  queryClient.setQueryData(['devices'], (oldData: any) => {
    if (!oldData) return oldData;

    return oldData.map((device: any) => {
      if (device.token === payload.token) {
        // Create updated device object with download progress
        const updatedDevice = {
          ...device,
          downloadProgress: payload.progress,
          downloadSpeed: payload.downloadSpeed,
          downloadedSongs: payload.downloadedSongs,
          totalSongs: payload.totalSongs,
          estimatedTimeRemaining: payload.estimatedTimeRemaining,
          playlistStatus: payload.status,
          retryCount: payload.retryCount,
          lastError: payload.lastError
        };

        // Show notifications based on status
        if (payload.status === 'error') {
          toast.error(`İndirme hatası: ${payload.lastError}`);
        } else if (payload.status === 'completed') {
          toast.success('Playlist başarıyla indirildi');
        }

        console.log('Updating device with progress:', updatedDevice);
        return updatedDevice;
      }
      return device;
    });
  });

  // Force a refetch to ensure UI is updated
  queryClient.invalidateQueries({ queryKey: ['devices'] });
};