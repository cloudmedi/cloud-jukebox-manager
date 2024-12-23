export interface Song {
  _id: string;
  name: string;
  artist: string;
  filePath: string;
  artwork?: string;
  genre?: string;
  album?: string;
  createdAt?: string;
  duration?: number;
  status?: 'active' | 'inactive';
}