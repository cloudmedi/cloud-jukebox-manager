import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";

export const handleDeviceStatusMessage = (message: any) => {
  console.log('Handling device status message:', message);

  // Update device data in cache
  const devices = queryClient.getQueryData<any[]>(['devices']);
  if (devices) {
    const updatedDevices = devices.map(device => {
      if (device.token === message.token) {
        // Handle volume updates
        if (message.volume !== undefined) {
          console.log(`Updating volume for device ${device.token} to ${message.volume}`);
          return {
            ...device,
            volume: message.volume
          };
        }

        // Handle online/offline status
        if (message.isOnline !== undefined) {
          if (!message.isOnline) {
            toast.warning(`${device.name || 'Cihaz'} çevrimdışı oldu`);
          }
          return {
            ...device,
            isOnline: message.isOnline
          };
        }

        // Handle playlist status
        if (message.playlistStatus) {
          if (message.playlistStatus === 'error') {
            toast.error(`Playlist yükleme hatası: ${device.name || 'Cihaz'}`);
          } else if (message.playlistStatus === 'loaded') {
            toast.success(`Playlist başarıyla yüklendi: ${device.name || 'Cihaz'}`);
          }
          return {
            ...device,
            playlistStatus: message.playlistStatus
          };
        }

        // Handle volume warnings
        if (message.volume && message.volume > 80) {
          toast.warning(`Yüksek ses seviyesi uyarısı: ${device.name || 'Cihaz'} - %${message.volume}`);
        }

        // If no specific updates, return device with all message updates
        return {
          ...device,
          ...message
        };
      }
      return device;
    });

    // Update query cache with new data
    queryClient.setQueryData(['devices'], updatedDevices);
  }
};