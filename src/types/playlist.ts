export interface Playlist {
  _id: string;
  name: string;
  description?: string;
  songs: any[];
  artwork?: string;
  totalDuration?: number;
  genre?: string;
  createdAt?: string;
  updatedAt?: string;
}