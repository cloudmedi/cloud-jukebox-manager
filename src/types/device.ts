export interface DeviceInfo {
  hostname: string;
  platform: string;
  arch: string;
  cpus: string;
  totalMemory: string;
  freeMemory: string;
  osVersion: string;
  networkInterfaces: string[];
}

export interface Device {
  _id: string;
  name: string;
  token: string;
  location?: string;
  ipAddress?: string;
  isOnline?: boolean;
  isPlaying?: boolean;
  version?: string;
  activePlaylist?: {
    _id: string;
    name: string;
  };
  playlistStatus?: 'loaded' | 'loading' | 'error' | 'emergency-stopped' | null;
  downloadProgress?: number;
  downloadSpeed?: number;
  downloadedSongs?: number;
  totalSongs?: number;
  estimatedTimeRemaining?: number;
  retryCount?: number;
  lastError?: string;
  volume?: number;
  groupId?: string;
  lastSeen?: string;
  createdAt?: string;
  updatedAt?: string;
  deviceInfo?: DeviceInfo;
  currentSong?: {
    name: string;
    artist: string;
  };
}