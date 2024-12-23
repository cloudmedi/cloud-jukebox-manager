export interface Device {
  _id: string;
  name: string;
  token: string;
  location: string;
  ipAddress?: string;
  isOnline: boolean;
  volume: number;
  lastSeen: string;
  activePlaylist?: {
    _id: string;
    name: string;
  };
  playlistStatus?: 'loaded' | 'loading' | 'error';
  isPlaying?: boolean;
  currentSong?: {
    name: string;
    artist: string;
  };
  groupId?: string;
}

class DeviceService {
  async togglePower(deviceId: string, currentState: boolean) {
    const response = await fetch(`http://localhost:5000/api/devices/${deviceId}/power`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ power: !currentState }),
    });

    if (!response.ok) {
      throw new Error('Cihaz durumu değiştirilemedi');
    }

    return response.json();
  }

  async updateGroup(deviceId: string, groupId: string | null) {
    const response = await fetch(`http://localhost:5000/api/devices/${deviceId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ groupId }),
    });

    if (!response.ok) {
      throw new Error('Cihaz grubu güncellenemedi');
    }

    return response.json();
  }

  async deleteDevice(deviceId: string) {
    const response = await fetch(`http://localhost:5000/api/devices/${deviceId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Cihaz silinemedi');
    }

    return response.json();
  }
}

export const deviceService = new DeviceService();