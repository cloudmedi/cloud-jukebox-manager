export interface Song {
  _id: string;
  name: string;
  artist: string;
  album?: string;
  duration: number;
  filePath: string;
  artwork?: string;
  createdAt: string;
  updatedAt: string;
}