import { toast } from "sonner";

export const handleDeviceStatusMessage = (message: any) => {
  // Handle online/offline status changes
  if (message.isOnline !== undefined) {
    if (!message.isOnline) {
      toast.warning(`${message.deviceName || 'Cihaz'} çevrimdışı oldu`);
    }
  }

  // Handle playlist status changes
  if (message.playlistStatus === 'error') {
    toast.error(`Playlist yükleme hatası: ${message.deviceName || 'Cihaz'}`);
  } else if (message.playlistStatus === 'loaded') {
    toast.success(`Playlist başarıyla yüklendi: ${message.deviceName || 'Cihaz'}`);
  }

  // Handle volume warnings (if volume is too high)
  if (message.volume && message.volume > 80) {
    toast.warning(`Yüksek ses seviyesi uyarısı: ${message.deviceName || 'Cihaz'} - %${message.volume}`);
  }
};