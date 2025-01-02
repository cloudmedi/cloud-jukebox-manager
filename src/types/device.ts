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

export interface Device {
  _id: string;
  name: string;
  token: string;
  location: string;
  ipAddress: string | null;
  isOnline: boolean;
  volume: number;
  isPlaying?: boolean;
  lastSeen: string;
  createdAt?: string;
  updatedAt?: string;
  groupId?: string | null;
  deviceInfo?: DeviceInfo;
  
  // Playlist ve indirme durumu
  playlistStatus?: 'loaded' | 'loading' | 'error';
  downloadProgress?: number;
  downloadSpeed?: number;
  downloadedSongs?: number;
  totalSongs?: number;
  estimatedTimeRemaining?: number;
  retryCount?: number;
  lastError?: string;
  
  activePlaylist?: {
    _id: string;
    name: string;
  };
  
  currentSong?: {
    _id: string;
    name: string;
    artist: string;
  };
}