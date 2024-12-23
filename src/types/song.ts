export interface Song {
  _id: string;
  name: string;
  artist: string;
  genre: string;
  album?: string;
  filePath: string;
  artwork?: string | null;
  duration: number;
  status?: 'active' | 'inactive';
  createdAt?: string;
}