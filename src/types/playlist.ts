export interface Playlist {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  songs: any[];
  totalDuration?: number;
  artwork?: string;
  genre?: string;
  status?: 'active' | 'inactive';
}