import { toast } from "@/components/ui/use-toast";

const API_URL = 'http://localhost:5000/api';

export interface Device {
  _id: string;
  name: string;
  token: string;
  location: string;
  ipAddress: string;
  isOnline: boolean;
  isPlaying?: boolean;
  volume: number;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
  activePlaylist: {
    _id: string;
    name: string;
  } | null;
  playlistStatus?: 'loaded' | 'loading' | 'error';
  groupId?: string | null;
  deviceInfo?: {
    hostname: string;
    platform: string;
    arch: string;
    cpus: string;
    totalMemory: string;
    freeMemory: string;
    networkInterfaces: string[];
    osVersion: string;
  };
}

export const deviceService = {
  async restartDevice(deviceId: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/devices/${deviceId}/restart`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Cihaz yeniden başlatılamadı');
      
      toast({
        title: "Başarılı",
        description: "Cihaz yeniden başlatılıyor",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Cihaz yeniden başlatılamadı",
      });
      throw error;
    }
  },

  async togglePower(deviceId: string, currentState: boolean): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/devices/${deviceId}/power`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ power: !currentState })
      });
      
      if (!response.ok) throw new Error('Cihaz durumu değiştirilemedi');
      
      toast({
        title: "Başarılı",
        description: `Cihaz ${!currentState ? 'açılıyor' : 'kapatılıyor'}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Cihaz durumu değiştirilemedi",
      });
      throw error;
    }
  },

  async setVolume(deviceId: string, volume: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/devices/${deviceId}/volume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ volume })
      });
      
      if (!response.ok) throw new Error('Ses seviyesi ayarlanamadı');
      
      toast({
        title: "Başarılı",
        description: "Ses seviyesi güncellendi",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Ses seviyesi ayarlanamadı",
      });
      throw error;
    }
  },

  async updateGroup(deviceId: string, groupId: string | null): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/devices/${deviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ groupId })
      });
      
      if (!response.ok) throw new Error('Grup güncellenemedi');
      
      toast({
        title: "Başarılı",
        description: "Cihaz grubu güncellendi",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Grup güncellenemedi",
      });
      throw error;
    }
  },

  async deleteDevice(deviceId: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/devices/${deviceId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Cihaz silinemedi');
      
      toast({
        title: "Başarılı",
        description: "Cihaz silindi",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Cihaz silinemedi",
      });
      throw error;
    }
  }
};