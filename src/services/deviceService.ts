export interface Device {
  _id: string;
  name: string;
  token: string;
  location: string;
  ipAddress?: string;
  isOnline: boolean;
  volume: number;
  lastSeen: string;
  activePlaylist?: {
    _id: string;
    name: string;
  };
  playlistStatus?: 'loaded' | 'loading' | 'error';
  isPlaying?: boolean;
  currentSong?: {
    name: string;
    artist: string;
  };
}