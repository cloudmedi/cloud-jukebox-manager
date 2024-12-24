export interface Song {
  _id: string;
  name: string;
  artist: string;
  genre: string;
  album?: string;
  year?: number;
  language?: string;
  duration: number;
  artwork?: string | null;
  filePath: string;
  localPath?: string;
  status?: 'active' | 'inactive';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}