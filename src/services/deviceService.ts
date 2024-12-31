import { toast } from "sonner";
import websocketService from "./websocketService";

export interface Device {
  _id: string;
  name: string;
  token: string;
  location?: string;
  ipAddress?: string;
  isOnline: boolean;
  lastSeen: string;
  volume: number;
  groupId?: string;
  playlistStatus?: 'loaded' | 'loading' | 'error';
  downloadProgress?: number;
  playbackStatus?: 'playing' | 'paused' | 'no-playlist';
  isPlaying?: boolean;
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
  activePlaylist?: {
    _id: string;
    name: string;
  };
  currentSong?: {
    _id: string;
    name: string;
    artist: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

class DeviceService {
  async getDevices(): Promise<Device[]> {
    const response = await fetch('http://localhost:5000/api/devices');
    if (!response.ok) {
      throw new Error('Failed to fetch devices');
    }
    return response.json();
  }

  async createDevice(deviceData: Partial<Device>): Promise<Device> {
    const response = await fetch('http://localhost:5000/api/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceData),
    });

    if (!response.ok) {
      throw new Error('Failed to create device');
    }

    return response.json();
  }

  async updateDevice(id: string, deviceData: Partial<Device>): Promise<Device> {
    const response = await fetch(`http://localhost:5000/api/devices/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceData),
    });

    if (!response.ok) {
      throw new Error('Failed to update device');
    }

    return response.json();
  }

  async deleteDevice(id: string): Promise<void> {
    const response = await fetch(`http://localhost:5000/api/devices/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete device');
    }
  }

  async updateGroup(deviceId: string, groupId: string | null): Promise<Device> {
    const response = await fetch(`http://localhost:5000/api/devices/${deviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ groupId }),
    });

    if (!response.ok) {
      throw new Error('Failed to update device group');
    }

    return response.json();
  }

  async setVolume(token: string, volume: number): Promise<void> {
    websocketService.sendMessage({
      type: 'command',
      command: 'setVolume',
      token,
      volume
    });
  }

  async restart(token: string): Promise<void> {
    websocketService.sendMessage({
      type: 'command',
      command: 'restart',
      token
    });
  }

  async emergencyStop(): Promise<void> {
    try {
      websocketService.sendMessage({
        type: 'command',
        command: 'emergency-stop'
      });
    } catch (error) {
      console.error('Emergency stop error:', error);
      toast.error('Acil durum komutu gönderilemedi');
      throw error;
    }
  }

  async emergencyReset(): Promise<void> {
    try {
      websocketService.sendMessage({
        type: 'command',
        command: 'emergency-reset'
      });
    } catch (error) {
      console.error('Emergency reset error:', error);
      toast.error('Acil durum sıfırlama komutu gönderilemedi');
      throw error;
    }
  }

  async getDeviceStats(): Promise<any> {
    const response = await fetch('http://localhost:5000/api/stats/devices');
    if (!response.ok) {
      throw new Error('Failed to fetch device stats');
    }
    return response.json();
  }
}

export const deviceService = new DeviceService();
