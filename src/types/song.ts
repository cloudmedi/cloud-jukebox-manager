export interface Song {
  _id: string;
  name: string;
  artist: string;
  genre: string;
  album?: string;
  duration: number;
  artwork: string | null;
  filePath: string;
  localPath?: string;
  createdAt: string;
  updatedAt: string;
  status?: 'active' | 'inactive';
}