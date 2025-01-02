import { toast } from "sonner";
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

export const handleDeviceStatusMessage = (message: any) => {
  console.log('Handling device status message:', message);

  // Update device data in React Query cache
  queryClient.setQueryData(['devices'], (oldData: any) => {
    if (!oldData) return oldData;

    return oldData.map((device: any) => {
      if (device.token === message.token) {
        return {
          ...device,
          isOnline: message.isOnline ?? device.isOnline,
          volume: message.volume ?? device.volume,
          playlistStatus: message.playlistStatus ?? device.playlistStatus,
          downloadProgress: message.downloadProgress ?? device.downloadProgress,
          downloadSpeed: message.downloadSpeed ?? device.downloadSpeed,
          downloadedSongs: message.downloadedSongs ?? device.downloadedSongs,
          totalSongs: message.totalSongs ?? device.totalSongs,
          estimatedTimeRemaining: message.estimatedTimeRemaining ?? device.estimatedTimeRemaining,
          retryCount: message.retryCount ?? device.retryCount,
          lastError: message.error ?? device.lastError
        };
      }
      return device;
    });
  });

  // Handle notifications
  if (message.isOnline !== undefined && !message.isOnline) {
    toast.warning(`${message.deviceName || 'Cihaz'} çevrimdışı oldu`);
  }

  if (message.playlistStatus === 'error') {
    toast.error(`Playlist yükleme hatası: ${message.deviceName || 'Cihaz'}`);
  } else if (message.playlistStatus === 'loaded') {
    toast.success(`Playlist başarıyla yüklendi: ${message.deviceName || 'Cihaz'}`);
  }

  if (message.volume && message.volume > 80) {
    toast.warning(`Yüksek ses seviyesi uyarısı: ${message.deviceName || 'Cihaz'} - %${message.volume}`);
  }
};