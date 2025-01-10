export interface Playlist {
  _id: string;
  id: string; // Making id required
  name: string;
  description?: string;
  songs: any[];
  totalDuration?: number;
  artwork?: string;
  genre?: string;
}