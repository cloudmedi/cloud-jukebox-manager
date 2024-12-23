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
  currentSong?: {
    name: string;
    artist: string;
    duration: number;
    playedAt: string;
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
    osVersion: string;
    networkInterfaces: string[];
  };
}