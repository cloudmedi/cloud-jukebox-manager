export interface DeviceInfo {
  hostname: string;
  platform: string;
  arch: string;
  cpus: string[];
  totalMemory: string;
  freeMemory: string;
  networkInterfaces: string[];
  osVersion: string;
  screenResolution?: string;
  timeZone?: string;
  browserInfo?: {
    name: string;
    version: string;
    userAgent: string;
  };
}

export interface Device {
  _id: string;
  token: string;
  name: string;
  location?: string;
  info: DeviceInfo;
  isOnline?: boolean;
  isPlaying?: boolean;
  version?: string;
  activePlaylist?: {
    _id: string;
    name: string;
  };
  playlistStatus?: string;
  lastSeen?: string;
  createdAt?: string;
  updatedAt?: string;
}