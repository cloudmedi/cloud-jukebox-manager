export interface Playlist {
  _id: string;
  id?: string; // Making id optional to match the backend response
  name: string;
  description?: string;
  songs: any[];
  totalDuration?: number;
  artwork?: string;
  genre?: string;
  status?: 'active' | 'inactive';
}