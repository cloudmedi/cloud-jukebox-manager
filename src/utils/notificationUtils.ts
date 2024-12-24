import { toast } from "sonner";

export const VOLUME_THRESHOLD = 80; // 80% volume threshold

export const showDeviceOfflineNotification = (deviceName: string) => {
  toast.error(`${deviceName} çevrimdışı oldu`, {
    description: "Cihaz bağlantısı kesildi",
  });
};

export const showVolumeWarning = (deviceName: string, volume: number) => {
  toast.warning(`Yüksek Ses Seviyesi`, {
    description: `${deviceName} ses seviyesi ${volume}% seviyesine ulaştı`,
  });
};

export const showPlaylistError = (deviceName: string, error: string) => {
  toast.error(`Playlist Yükleme Hatası`, {
    description: `${deviceName}: ${error}`,
  });
};