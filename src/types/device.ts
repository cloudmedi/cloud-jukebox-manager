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
  isPlaying: boolean;
  lastSeen: string;
  createdAt?: string;
  updatedAt?: string;
  groupId?: string;
  deviceInfo?: DeviceInfo;
  
  // Playlist ve indirme durumu
  playlistStatus: 'completed' | 'downloading' | 'error' | null;
  downloadProgress?: {
    playlistId: string;
    totalSongs: number;
    completedSongs: number;
    currentSong: {
      current: number;
      total: number;
      name: string;
    };
    progress: number;
  };
  activePlaylist?: string;
  volume: number;
  emergencyStopped: boolean;
  currentSong?: {
    _id: string;
    name: string;
    artist: string;
  };
}