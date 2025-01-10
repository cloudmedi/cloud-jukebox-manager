export interface Playlist {
  _id: string; 
  id?: string; // Made optional since it's causing conflicts
  name: string;
  description?: string;
  songs: any[];
  totalDuration?: number;
  artwork?: string;
  genre?: string;
}