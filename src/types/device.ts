export interface DeviceInfo {
  hostname: string;
  platform: string;
  arch: string;
  cpus: string;
  totalMemory: string;
  freeMemory: string;
  networkInterfaces: string[];
  osVersion: string;
  language: string;
  screenResolution: string;
  timeZone: string;
  browserInfo: {
    name: string;
    version: string;
  };
}

export interface TokenResponse {
  token: string;
  deviceInfo: DeviceInfo;
}

export interface Device {
  _id: string;
  name: string;
  token: string;
  location: string;
  ipAddress: string | null;
  isOnline: boolean;
  volume: number;
  isPlaying?: boolean;
  downloadProgress?: number;
  downloadedSongs?: number;
  totalSongs?: number;
  downloadSpeed?: number;
  estimatedTimeRemaining?: number;
  retryCount?: number;
  lastError?: string;
  activePlaylist?: {
    _id: string;
    name: string;
  };
  currentSong?: {
    name: string;
    artist: string;
  };
  playlistStatus?: 'loaded' | 'loading' | 'error' | 'emergency-stopped' | null;
  deviceInfo?: DeviceInfo;
  groupId?: string | null;
  lastSeen: string;
  createdAt?: string;
  updatedAt?: string;
  emergencyStopped?: boolean;
}