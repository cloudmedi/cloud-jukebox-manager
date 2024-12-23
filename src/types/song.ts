export interface Song {
  _id: string;
  name: string;
  artist: string;
  genre: string;
  album?: string;
  year?: number;
  language?: string;
  duration: number;
  artwork: string | null;
  filePath: string;
  status?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}