export interface Song {
  _id: string;
  name: string;
  artist: string;
  genre: string;
  album?: string;
  year?: number;
  language?: string;
  filePath: string;
  localPath?: string;
  artwork: string | null;
  duration: number;
  status?: 'active' | 'inactive';
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}