export interface DeviceInfo {
  hostname: string;
  platform: string;
  arch: string;
  cpus: string;
  totalMemory: string;
  freeMemory: string;
  networkInterfaces: string[];
  osVersion: string;
  language?: string; // Made optional since it's used in tokenService
  screenResolution?: string;
  timeZone?: string;
  browserInfo?: {
    name: string;
    version: string;
  };
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
  status?: string; // Added for DeviceTable
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