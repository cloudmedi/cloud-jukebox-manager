export interface Device {
  _id: string;
  name: string;
  token: string;
  location: string;
  ipAddress: string | null;
  isOnline: boolean;
  isPlaying?: boolean;
  volume: number;
  activePlaylist: {
    _id: string;
    name: string;
    songs: string[];
    artwork: string | null;
  } | null;
  currentSong?: {
    name: string;
    artist: string;
  } | null;
  playlistStatus: 'loaded' | 'loading' | 'error' | null;
  groupId: string | null;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
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

export interface DeviceGroup {
  _id: string;
  name: string;
  description?: string;
  devices: string[];
}

// Device service functions
const togglePower = async (deviceId: string, currentState: boolean) => {
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
};

const updateGroup = async (deviceId: string, groupId: string | null) => {
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
};

const deleteDevice = async (deviceId: string) => {
  const response = await fetch(`http://localhost:5000/api/devices/${deviceId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Cihaz silinemedi');
  }

  return response.json();
};

export const deviceService = {
  togglePower,
  updateGroup,
  deleteDevice,
};