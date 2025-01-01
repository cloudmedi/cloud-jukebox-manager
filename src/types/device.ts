export interface DeviceInfo {
  hostname: string;
  platform: string;
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
  activePlaylist: {
    _id: string;
    name: string;
  } | null;
  playlistStatus: 'loaded' | 'loading' | 'error' | 'emergency-stopped' | null;
  groupId: string | null;
  lastSeen: string;
  downloadProgress: number;
  downloadedSongs: number;
  totalSongs: number;
  downloadSpeed: number;
  estimatedTimeRemaining: number;
  retryCount: number;
  lastError: string | null;
  emergencyStopped: boolean;
}