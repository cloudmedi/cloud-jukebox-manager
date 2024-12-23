export interface Song {
  _id: string;
  name: string;
  artist: string;
  genre: string;
  album?: string;
  year?: number;
  language?: string;
  duration: number;
  createdAt: string;
  filePath: string;
  status?: 'active' | 'inactive';
}