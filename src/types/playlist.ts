export interface Song {
  _id: string;
  name: string;
  artist: string;
  duration: number;
  filePath: string;
}

export interface Playlist {
  _id: string;
  name: string;
  description?: string;
  songs: Song[];
  artwork?: string;
  totalDuration?: number;
  createdAt: string;
  updatedAt: string;
}