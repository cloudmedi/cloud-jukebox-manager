export interface Device {
  _id: string;
  name: string;
  token: string;
  location?: string;
  status?: string;
  isOnline?: boolean;
  version?: string;
  activePlaylist?: string;
  playlistStatus?: string;
}