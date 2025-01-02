export interface Device {
  _id: string;
  name: string;
  token: string;
  location?: string;
  ipAddress?: string;
  isOnline: boolean;
  volume: number;
  lastSeen: string;
  groupId?: string;
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