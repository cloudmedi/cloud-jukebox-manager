import { toast } from "sonner";

export const handleDeviceStatusMessage = (message: any) => {
  if (message.isOnline !== undefined) {
    toast.info(`Cihaz ${message.token}: ${message.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}`);
  }
  
  if (message.isPlaying !== undefined) {
    console.log(`Cihaz ${message.token} çalma durumu:`, message.isPlaying);
  }

  if (message.volume !== undefined) {
    console.log(`Cihaz ${message.token} ses seviyesi:`, message.volume);
  }
};