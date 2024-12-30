import axios from 'axios';

export interface Device {
  _id: string;
  id: string; // Eklendi
  name: string;
  token: string;
  location: string;
  ipAddress?: string;
  isOnline: boolean;
  volume: number;
  isPlaying?: boolean;
  downloadProgress?: number;
  activePlaylist?: {
    _id: string;
    name: string;
  };
  currentSong?: {
    name: string;
    artist: string;
  };
  playlistStatus?: string;
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
  groupId?: string;
  lastSeen: string;
  createdAt?: string;
  updatedAt?: string;
}

const API_URL = 'http://localhost:5000/api/devices';

export const deviceService = {
  getDevices: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  createDevice: async (deviceData: Partial<Device>) => {
    const response = await axios.post(API_URL, deviceData);
    return response.data;
  },

  updateDevice: async (id: string, deviceData: Partial<Device>) => {
    const response = await axios.patch(`${API_URL}/${id}`, deviceData);
    return response.data;
  },

  deleteDevice: async (id: string) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  },

  updateGroup: async (deviceId: string, groupId: string | null) => {
    const response = await axios.patch(`${API_URL}/${deviceId}`, { groupId });
    return response.data;
  },

  emergencyStop: async () => {
    const response = await fetch(`${API_URL}/emergency-stop`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Emergency stop failed');
    }
    
    return response.json();
  },

  emergencyReset: async () => {
    const response = await fetch(`${API_URL}/emergency-reset`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Emergency reset failed');
    }
    
    return response.json();
  }
};