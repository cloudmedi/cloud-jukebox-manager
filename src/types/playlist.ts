export interface Playlist {
  _id: string;
  id?: string; // Adding optional id field for compatibility
  name: string;
  description?: string;
  songs: any[];
  totalDuration?: number;
  artwork?: string;
  genre?: string;
}