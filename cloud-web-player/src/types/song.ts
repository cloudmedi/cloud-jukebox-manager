export interface Song {
  _id: string;
  name: string;
  artist: string;
  filePath: string;
  duration?: number;
  artwork?: string | null;
}